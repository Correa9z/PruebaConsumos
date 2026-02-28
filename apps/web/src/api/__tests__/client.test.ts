import {
  getProducts,
  getConfig,
  getTransactionStatus,
  getWompiMerchant,
  tokenizeCard,
  createPayment,
  createPaymentLink,
} from "../client";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getProducts returns data on 200", async () => {
    const products = [{ id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] }];
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(products),
    });
    const result = await getProducts();
    expect(result).toEqual(products);
    expect(fetch).toHaveBeenCalledWith("/api/products");
  });

  it("getProducts throws on !ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(getProducts()).rejects.toThrow("Failed to load products");
  });

  it("getConfig returns config on 200", async () => {
    const config = { baseFeeInCents: 500, deliveryFeeInCents: 1500 };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(config),
    });
    const result = await getConfig();
    expect(result).toEqual(config);
    expect(fetch).toHaveBeenCalledWith("/api/config");
  });

  it("getConfig throws on !ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(getConfig()).rejects.toThrow("Failed to load configuration");
  });

  it("getWompiMerchant returns data on 200", async () => {
    const data = { acceptanceToken: "t", acceptPersonalAuth: "a", permalinkPolicy: null, permalinkPersonalData: null };
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
    const result = await getWompiMerchant();
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/wompi/merchant");
  });

  it("getWompiMerchant throws with data.error on !ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Merchant error" }),
    });
    await expect(getWompiMerchant()).rejects.toThrow("Merchant error");
  });

  it("getWompiMerchant throws default when json fails on !ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("parse")),
    });
    await expect(getWompiMerchant()).rejects.toThrow("Failed to load Wompi acceptance");
  });

  it("tokenizeCard returns token on 200", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "tok_123" } }),
    });
    const result = await tokenizeCard("https://wompi.co", "pk", {
      number: "4111 1111 1111 1111",
      cvc: "123",
      expMonth: "1",
      expYear: "28",
      cardHolder: "Test",
    });
    expect(result).toBe("tok_123");
    expect(fetch).toHaveBeenCalledWith(
      "https://wompi.co/tokens/cards",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("tokenizeCard throws on !ok with error.reason", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { reason: "invalid_card" } }),
    });
    await expect(
      tokenizeCard("https://wompi.co", "pk", {
        number: "4111111111111111",
        cvc: "123",
        expMonth: "12",
        expYear: "28",
        cardHolder: "Test",
      })
    ).rejects.toThrow("invalid_card");
  });

  it("tokenizeCard throws when no token in response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });
    await expect(
      tokenizeCard("https://wompi.co", "pk", {
        number: "4111111111111111",
        cvc: "123",
        expMonth: "12",
        expYear: "28",
        cardHolder: "Test",
      })
    ).rejects.toThrow("Card token not received");
  });

  it("createPayment returns data on 200", async () => {
    const data = {
      transactionNumber: "T-1",
      transactionId: "id",
      status: "APPROVED",
      totalInCents: 1000,
      quantity: 1,
    };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });
    const result = await createPayment({
      productId: "p1",
      quantity: 1,
      amountInCents: 1000,
      customerEmail: "a@b.co",
      customerFullName: "Name",
      delivery: { address: "A", city: "C", phone: "1" },
      acceptanceToken: "t",
      paymentMethodToken: "tok",
    });
    expect(result).toEqual(data);
  });

  it("createPayment throws on !ok with string error", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Payment failed" }),
    });
    await expect(
      createPayment({
        productId: "p1",
        quantity: 1,
        amountInCents: 1000,
        customerEmail: "a@b.co",
        customerFullName: "Name",
        delivery: { address: "A", city: "C", phone: "1" },
        acceptanceToken: "t",
        paymentMethodToken: "tok",
      })
    ).rejects.toThrow("Payment failed");
  });

  it("createPayment throws on !ok with object error (message)", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Out of stock" } }),
    });
    await expect(
      createPayment({
        productId: "p1",
        quantity: 1,
        amountInCents: 1000,
        customerEmail: "a@b.co",
        customerFullName: "Name",
        delivery: { address: "A", city: "C", phone: "1" },
        acceptanceToken: "t",
        paymentMethodToken: "tok",
      })
    ).rejects.toThrow("Out of stock");
  });

  it("createPaymentLink returns data on 200", async () => {
    const data = {
      transactionId: "tid",
      transactionNumber: "T-1",
      paymentLinkUrl: "https://link",
    };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });
    const result = await createPaymentLink({
      productId: "p1",
      quantity: 1,
      customerEmail: "a@b.co",
      customerFullName: "Name",
      delivery: { address: "A", city: "C", phone: "1" },
    });
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/payments/create-link", expect.any(Object));
  });

  it("createPaymentLink throws on !ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Link error" }),
    });
    await expect(
      createPaymentLink({
        productId: "p1",
        quantity: 1,
        customerEmail: "a@b.co",
        customerFullName: "Name",
        delivery: { address: "A", city: "C", phone: "1" },
      })
    ).rejects.toThrow("Link error");
  });

  it("getTransactionStatus returns null on 404", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ status: 404 });
    const result = await getTransactionStatus("unknown-id");
    expect(result).toBeNull();
  });

  it("getTransactionStatus returns null when !ok and not 404", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const result = await getTransactionStatus("x");
    expect(result).toBeNull();
  });

  it("getTransactionStatus returns data on 200", async () => {
    const data = { status: "APPROVED", transactionNumber: "TXN-1" };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
    const result = await getTransactionStatus("wompi-123");
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("providerId=wompi-123"));
  });
});
