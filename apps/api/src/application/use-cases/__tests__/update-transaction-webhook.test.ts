import { updateTransactionFromWebhook } from "../update-transaction-webhook";
import type { ITransactionRepository, IProductRepository } from "../../ports";
import type { TransactionEntity, ProductEntity } from "@/domain/entities";

function mockTransaction(overrides: Partial<TransactionEntity> = {}): TransactionEntity {
  return {
    id: "tx-1",
    transactionNumber: "TXN-1",
    productId: "p1",
    customerId: "c1",
    deliveryId: "d1",
    quantity: 2,
    amountInCents: 1000,
    baseFeeInCents: 500,
    deliveryFeeInCents: 1500,
    totalInCents: 3000,
    status: "PENDING",
    providerTransactionId: null,
    wompiPaymentLinkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockProduct(overrides: Partial<ProductEntity> = {}): ProductEntity {
  return {
    id: "p1",
    name: "Product",
    description: "Desc",
    priceInCents: 500,
    stock: 10,
    imageUrls: [],
    ...overrides,
  };
}

describe("updateTransactionFromWebhook", () => {
  it("finds by providerTransactionId and updates status", async () => {
    const tx = mockTransaction({ providerTransactionId: "wompi-123" });
    const transactionRepo = {
      findByProviderTransactionId: jest.fn().mockResolvedValue(tx),
      findByWompiPaymentLinkId: jest.fn(),
      findByTransactionNumber: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn().mockImplementation((id: string, status: string) =>
        Promise.resolve(mockTransaction({ ...tx, id, status, providerTransactionId: "wompi-123" }))
      ),
      updateProviderId: jest.fn(),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const productRepo = {
      findById: jest.fn().mockResolvedValue(mockProduct({ stock: 10 })),
      findAll: jest.fn(),
      updateStock: jest.fn().mockResolvedValue(mockProduct()),
    } as unknown as IProductRepository;
    const result = await updateTransactionFromWebhook(
      "wompi-123",
      "APPROVED",
      { transactionRepo, productRepo }
    );
    expect(result.success).toBe(true);
    expect(transactionRepo.updateStatus).toHaveBeenCalledWith("tx-1", "APPROVED", "wompi-123");
    expect(productRepo.updateStock).toHaveBeenCalledWith("p1", 8);
  });

  it("finds by paymentLinkId when providerId not found", async () => {
    const tx = mockTransaction({ providerTransactionId: null, wompiPaymentLinkId: "link-1" });
    const transactionRepo = {
      findByProviderTransactionId: jest.fn().mockResolvedValue(null),
      findByWompiPaymentLinkId: jest.fn().mockResolvedValue(tx),
      findByTransactionNumber: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn().mockImplementation((id: string, status: string) =>
        Promise.resolve(mockTransaction({ ...tx, id, status, providerTransactionId: "wompi-456" }))
      ),
      updateProviderId: jest.fn().mockResolvedValue(tx),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const productRepo = {
      findById: jest.fn().mockResolvedValue(mockProduct()),
      findAll: jest.fn(),
      updateStock: jest.fn().mockResolvedValue(mockProduct()),
    } as unknown as IProductRepository;
    const result = await updateTransactionFromWebhook(
      "wompi-456",
      "APPROVED",
      { transactionRepo, productRepo },
      { paymentLinkId: "link-1" }
    );
    expect(result.success).toBe(true);
    expect(transactionRepo.updateProviderId).toHaveBeenCalledWith("tx-1", "wompi-456");
  });

  it("finds by reference when providerId and paymentLinkId not found", async () => {
    const tx = mockTransaction({ providerTransactionId: null });
    const transactionRepo = {
      findByProviderTransactionId: jest.fn().mockResolvedValue(null),
      findByWompiPaymentLinkId: jest.fn().mockResolvedValue(null),
      findByTransactionNumber: jest.fn().mockResolvedValue(tx),
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn().mockImplementation((id: string, status: string) =>
        Promise.resolve(mockTransaction({ ...tx, id, status }))
      ),
      updateProviderId: jest.fn().mockResolvedValue(tx),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const productRepo = {
      findById: jest.fn().mockResolvedValue(mockProduct()),
      findAll: jest.fn(),
      updateStock: jest.fn().mockResolvedValue(mockProduct()),
    } as unknown as IProductRepository;
    const result = await updateTransactionFromWebhook(
      "wompi-789",
      "DECLINED",
      { transactionRepo, productRepo },
      { reference: "TXN-1" }
    );
    expect(result.success).toBe(true);
    expect(transactionRepo.updateProviderId).toHaveBeenCalledWith("tx-1", "wompi-789");
  });

  it("returns err when transaction not found", async () => {
    const transactionRepo = {
      findByProviderTransactionId: jest.fn().mockResolvedValue(null),
      findByWompiPaymentLinkId: jest.fn().mockResolvedValue(null),
      findByTransactionNumber: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateProviderId: jest.fn(),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const productRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStock: jest.fn(),
    } as unknown as IProductRepository;
    const result = await updateTransactionFromWebhook(
      "wompi-unknown",
      "APPROVED",
      { transactionRepo, productRepo }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Transaction not found");
  });

  it("does not update stock when status is DECLINED", async () => {
    const tx = mockTransaction({ providerTransactionId: "wompi-1" });
    const transactionRepo = {
      findByProviderTransactionId: jest.fn().mockResolvedValue(tx),
      findByWompiPaymentLinkId: jest.fn(),
      findByTransactionNumber: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(mockTransaction({ ...tx, status: "DECLINED" })),
      updateProviderId: jest.fn(),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const productRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStock: jest.fn(),
    } as unknown as IProductRepository;
    await updateTransactionFromWebhook("wompi-1", "DECLINED", { transactionRepo, productRepo });
    expect(productRepo.updateStock).not.toHaveBeenCalled();
  });
});
