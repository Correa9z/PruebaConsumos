import { createPayment } from "../create-payment";
import type {
  ITransactionRepository,
  ICustomerRepository,
  IDeliveryRepository,
  IProductRepository,
  IPaymentProvider,
} from "../../ports";
import type { TransactionEntity, ProductEntity, CustomerEntity, DeliveryEntity } from "@/domain/entities";

function mockProduct(): ProductEntity {
  return {
    id: "p1",
    name: "Product",
    description: "Desc",
    priceInCents: 1000,
    stock: 5,
    imageUrls: [],
  };
}

function mockTransaction(): TransactionEntity {
  return {
    id: "tx-1",
    transactionNumber: "TXN-1",
    productId: "p1",
    customerId: "c1",
    deliveryId: "d1",
    quantity: 1,
    amountInCents: 1000,
    baseFeeInCents: 500,
    deliveryFeeInCents: 1500,
    totalInCents: 3000,
    status: "PENDING",
    providerTransactionId: null,
    wompiPaymentLinkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("createPayment", () => {
  const defaultInput = {
    productId: "p1",
    quantity: 1,
    amountInCents: 1000,
    baseFeeInCents: 500,
    deliveryFeeInCents: 1500,
    customerEmail: "a@b.co",
    customerFullName: "Name",
    delivery: { address: "Addr", city: "City", phone: "123" },
    acceptanceToken: "token",
    paymentMethodToken: "pm-token",
  };

  it("calls buildSignature with transactionNumber and totalInCents", async () => {
    const product = mockProduct();
    const customer: CustomerEntity = { id: "c1", email: "a@b.co", fullName: "Name" };
    const delivery: DeliveryEntity = {
      id: "d1",
      address: "Addr",
      city: "City",
      region: null,
      phone: "123",
      postalCode: null,
    };
    const transaction = mockTransaction();
    const buildSignature = jest.fn().mockReturnValue("sig");
    await createPayment(
      { ...defaultInput, acceptPersonalAuth: "personal-auth" },
      {
        productRepo: {
          findAll: jest.fn(),
          findById: jest.fn().mockResolvedValue(product),
          updateStock: jest.fn(),
        },
        transactionRepo: {
          create: jest.fn().mockResolvedValue(transaction),
          findByTransactionNumber: jest.fn(),
          findById: jest.fn(),
          findByProviderTransactionId: jest.fn(),
          findByWompiPaymentLinkId: jest.fn(),
          updateStatus: jest.fn(),
          updateProviderId: jest.fn(),
          updateWompiPaymentLinkId: jest.fn(),
        },
        customerRepo: { findOrCreate: jest.fn().mockResolvedValue(customer) },
        deliveryRepo: { create: jest.fn().mockResolvedValue(delivery) },
        paymentProvider: {
          createTransaction: jest.fn().mockResolvedValue({ ok: true, transactionId: "w-1", status: "APPROVED" }),
        },
        generateTransactionNumber: () => "TXN-99",
        buildSignature,
      }
    );
    expect(buildSignature).toHaveBeenCalledWith("TXN-99", 3000);
  });

  it("returns err when product not found", async () => {
    const result = await createPayment(
      { ...defaultInput, productId: "missing" },
      {
        productRepo: { findAll: jest.fn(), findById: jest.fn().mockResolvedValue(null), updateStock: jest.fn() },
        transactionRepo: {} as ITransactionRepository,
        customerRepo: {} as ICustomerRepository,
        deliveryRepo: {} as IDeliveryRepository,
        paymentProvider: { createTransaction: jest.fn() },
        generateTransactionNumber: () => "TXN-1",
        buildSignature: () => "sig",
      }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Product not found");
  });

  it("returns err when insufficient stock", async () => {
    const result = await createPayment(
      { ...defaultInput, quantity: 100 },
      {
        productRepo: {
          findAll: jest.fn(),
          findById: jest.fn().mockResolvedValue(mockProduct()),
          updateStock: jest.fn(),
        },
        transactionRepo: {} as ITransactionRepository,
        customerRepo: {} as ICustomerRepository,
        deliveryRepo: {} as IDeliveryRepository,
        paymentProvider: { createTransaction: jest.fn() },
        generateTransactionNumber: () => "TXN-1",
        buildSignature: () => "sig",
      }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Insufficient stock");
  });

  it("returns ok when provider createTransaction succeeds", async () => {
    const product = mockProduct();
    const customer: CustomerEntity = { id: "c1", email: "a@b.co", fullName: "Name" };
    const delivery: DeliveryEntity = {
      id: "d1",
      address: "Addr",
      city: "City",
      region: null,
      phone: "123",
      postalCode: null,
    };
    const transaction = mockTransaction();
    const transactionRepo = {
      create: jest.fn().mockResolvedValue(transaction),
      findByTransactionNumber: jest.fn(),
      findById: jest.fn(),
      findByProviderTransactionId: jest.fn(),
      findByWompiPaymentLinkId: jest.fn(),
      updateStatus: jest.fn(),
      updateProviderId: jest.fn().mockResolvedValue(transaction),
      updateWompiPaymentLinkId: jest.fn(),
    } as unknown as ITransactionRepository;
    const result = await createPayment(defaultInput, {
      productRepo: {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue(product),
        updateStock: jest.fn(),
      },
      transactionRepo,
      customerRepo: { findOrCreate: jest.fn().mockResolvedValue(customer) },
      deliveryRepo: { create: jest.fn().mockResolvedValue(delivery) },
      paymentProvider: {
        createTransaction: jest.fn().mockResolvedValue({ ok: true, transactionId: "wompi-1", status: "APPROVED" }),
      },
      generateTransactionNumber: () => "TXN-1",
      buildSignature: jest.fn().mockReturnValue("signature"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.providerTransactionId).toBe("wompi-1");
    }
    expect(transactionRepo.updateProviderId).toHaveBeenCalledWith("tx-1", "wompi-1");
  });

  it("returns err when provider createTransaction fails", async () => {
    const product = mockProduct();
    const customer: CustomerEntity = { id: "c1", email: "a@b.co", fullName: "Name" };
    const delivery: DeliveryEntity = {
      id: "d1",
      address: "Addr",
      city: "City",
      region: null,
      phone: "123",
      postalCode: null,
    };
    const transaction = mockTransaction();
    const result = await createPayment(defaultInput, {
      productRepo: {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue(product),
        updateStock: jest.fn(),
      },
      transactionRepo: {
        create: jest.fn().mockResolvedValue(transaction),
        findByTransactionNumber: jest.fn(),
        findById: jest.fn(),
        findByProviderTransactionId: jest.fn(),
        findByWompiPaymentLinkId: jest.fn(),
        updateStatus: jest.fn(),
        updateProviderId: jest.fn(),
        updateWompiPaymentLinkId: jest.fn(),
      },
      customerRepo: { findOrCreate: jest.fn().mockResolvedValue(customer) },
      deliveryRepo: { create: jest.fn().mockResolvedValue(delivery) },
      paymentProvider: {
        createTransaction: jest.fn().mockResolvedValue({ ok: false, error: "Card declined" }),
      },
      generateTransactionNumber: () => "TXN-1",
      buildSignature: () => "sig",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Card declined");
  });
});
