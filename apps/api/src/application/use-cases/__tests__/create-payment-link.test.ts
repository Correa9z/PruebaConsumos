import { createPaymentLink } from "../create-payment-link";
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
    transactionNumber: "TXN-ABC",
    productId: "p1",
    customerId: "c1",
    deliveryId: "d1",
    quantity: 2,
    amountInCents: 2000,
    baseFeeInCents: 500,
    deliveryFeeInCents: 1500,
    totalInCents: 4000,
    status: "PENDING",
    providerTransactionId: null,
    wompiPaymentLinkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("createPaymentLink", () => {
  const defaultInput = {
    productId: "p1",
    quantity: 2,
    amountInCents: 2000,
    baseFeeInCents: 500,
    deliveryFeeInCents: 1500,
    customerEmail: "a@b.co",
    customerFullName: "Name",
    delivery: { address: "Addr", city: "City", phone: "123" },
  };

  it("returns err when createPaymentLink not supported", async () => {
    const paymentProvider: IPaymentProvider = {
      createTransaction: jest.fn(),
      createPaymentLink: undefined,
    };
    const result = await createPaymentLink(defaultInput, {
      productRepo: { findAll: jest.fn(), findById: jest.fn().mockResolvedValue(mockProduct()), updateStock: jest.fn() },
      transactionRepo: {} as ITransactionRepository,
      customerRepo: {} as ICustomerRepository,
      deliveryRepo: {} as IDeliveryRepository,
      paymentProvider,
      generateTransactionNumber: () => "TXN-1",
      getRedirectBaseUrl: () => "http://localhost:3000",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Payment links not supported");
  });

  it("returns err when product not found", async () => {
    const result = await createPaymentLink(
      { ...defaultInput, productId: "missing" },
      {
        productRepo: { findAll: jest.fn(), findById: jest.fn().mockResolvedValue(null), updateStock: jest.fn() },
        transactionRepo: {} as ITransactionRepository,
        customerRepo: {} as ICustomerRepository,
        deliveryRepo: {} as IDeliveryRepository,
        paymentProvider: { createTransaction: jest.fn(), createPaymentLink: jest.fn() },
        generateTransactionNumber: () => "TXN-1",
        getRedirectBaseUrl: () => "http://localhost:3000",
      }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Product not found");
  });

  it("returns err when insufficient stock", async () => {
    const result = await createPaymentLink(
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
        paymentProvider: { createTransaction: jest.fn(), createPaymentLink: jest.fn() },
        generateTransactionNumber: () => "TXN-1",
        getRedirectBaseUrl: () => "http://localhost:3000",
      }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Insufficient stock");
  });

  it("returns ok with paymentLinkUrl when provider succeeds", async () => {
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
    const transactionRepo: ITransactionRepository = {
      create: jest.fn().mockResolvedValue(transaction),
      findByTransactionNumber: jest.fn(),
      findById: jest.fn(),
      findByProviderTransactionId: jest.fn(),
      findByWompiPaymentLinkId: jest.fn(),
      updateStatus: jest.fn(),
      updateProviderId: jest.fn(),
      updateWompiPaymentLinkId: jest.fn().mockResolvedValue(transaction),
    };
    const result = await createPaymentLink(defaultInput, {
      productRepo: {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue(product),
        updateStock: jest.fn(),
      },
      transactionRepo,
      customerRepo: {
        findOrCreate: jest.fn().mockResolvedValue(customer),
      },
      deliveryRepo: {
        create: jest.fn().mockResolvedValue(delivery),
      },
      paymentProvider: {
        createTransaction: jest.fn(),
        createPaymentLink: jest.fn().mockResolvedValue({
          ok: true,
          paymentLinkUrl: "https://checkout.wompi.co/l/abc",
          linkId: "abc",
        }),
      },
      generateTransactionNumber: () => "TXN-123",
      getRedirectBaseUrl: () => "http://localhost:3000",
      getPaymentRedirectBaseUrl: () => "http://localhost:3001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paymentLinkUrl).toBe("https://checkout.wompi.co/l/abc");
      expect(result.data.transactionNumber).toBe("TXN-123");
    }
    expect(transactionRepo.updateWompiPaymentLinkId).toHaveBeenCalledWith("tx-1", "abc");
  });

  it("returns err when provider createPaymentLink fails", async () => {
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
    const result = await createPaymentLink(defaultInput, {
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
        createTransaction: jest.fn(),
        createPaymentLink: jest.fn().mockResolvedValue({ ok: false, error: "Wompi error" }),
      },
      generateTransactionNumber: () => "TXN-1",
      getRedirectBaseUrl: () => "http://localhost:3000",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Wompi error");
  });
});
