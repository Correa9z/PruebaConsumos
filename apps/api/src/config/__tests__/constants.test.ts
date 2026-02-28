import {
  getBaseFeeCents,
  getDeliveryFeeCents,
  buildSignature,
  generateTransactionNumber,
  getRedirectBaseUrl,
  getPaymentRedirectBaseUrl,
} from "../constants";

describe("constants", () => {
  describe("getBaseFeeCents", () => {
    it("returns 500", () => {
      expect(getBaseFeeCents()).toBe(500);
    });
  });

  describe("getDeliveryFeeCents", () => {
    it("returns 1500", () => {
      expect(getDeliveryFeeCents()).toBe(1500);
    });
  });

  describe("buildSignature", () => {
    it("returns reference + totalCents when PAYMENT_INTEGRITY_KEY is empty", () => {
      const orig = process.env.PAYMENT_INTEGRITY_KEY;
      delete process.env.PAYMENT_INTEGRITY_KEY;
      expect(buildSignature("REF1", 1000)).toBe("REF11000");
      if (orig !== undefined) process.env.PAYMENT_INTEGRITY_KEY = orig;
    });

    it("returns sha256 hex when PAYMENT_INTEGRITY_KEY is set", () => {
      process.env.PAYMENT_INTEGRITY_KEY = "secret";
      const sig = buildSignature("REF1", 1000);
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
      expect(sig).not.toBe("REF11000");
    });
  });

  describe("generateTransactionNumber", () => {
    it("returns string starting with TXN-", () => {
      expect(generateTransactionNumber()).toMatch(/^TXN-/);
    });

    it("returns unique values", () => {
      const a = generateTransactionNumber();
      const b = generateTransactionNumber();
      expect(a).not.toBe(b);
    });
  });

  describe("getRedirectBaseUrl", () => {
    it("returns FRONTEND_URL when set", () => {
      process.env.FRONTEND_URL = "https://app.example.com";
      expect(getRedirectBaseUrl()).toBe("https://app.example.com");
    });

    it("returns default localhost:3000 when not set", () => {
      const orig = process.env.FRONTEND_URL;
      const origNext = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.FRONTEND_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getRedirectBaseUrl()).toBe("http://localhost:3000");
      if (orig !== undefined) process.env.FRONTEND_URL = orig;
      if (origNext !== undefined) process.env.NEXT_PUBLIC_APP_URL = origNext;
    });
  });

  describe("getPaymentRedirectBaseUrl", () => {
    it("returns PAYMENT_REDIRECT_URL when set", () => {
      process.env.PAYMENT_REDIRECT_URL = "https://ngrok.io";
      expect(getPaymentRedirectBaseUrl()).toBe("https://ngrok.io");
    });

    it("falls back to API_URL when PAYMENT_REDIRECT_URL not set", () => {
      const origRedirect = process.env.PAYMENT_REDIRECT_URL;
      delete process.env.PAYMENT_REDIRECT_URL;
      process.env.API_URL = "http://localhost:3001";
      expect(getPaymentRedirectBaseUrl()).toBe("http://localhost:3001");
      if (origRedirect !== undefined) process.env.PAYMENT_REDIRECT_URL = origRedirect;
    });

    it("falls back to API_URL when PAYMENT_REDIRECT_URL is empty string", () => {
      const origRedirect = process.env.PAYMENT_REDIRECT_URL;
      process.env.PAYMENT_REDIRECT_URL = "";
      process.env.API_URL = "http://localhost:3001";
      expect(getPaymentRedirectBaseUrl()).toBe("http://localhost:3001");
      if (origRedirect !== undefined) process.env.PAYMENT_REDIRECT_URL = origRedirect;
      else delete process.env.PAYMENT_REDIRECT_URL;
    });

    it("falls back to default when neither set", () => {
      const origRedirect = process.env.PAYMENT_REDIRECT_URL;
      const origApi = process.env.API_URL;
      const origNextApi = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.PAYMENT_REDIRECT_URL;
      delete process.env.API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;
      expect(getPaymentRedirectBaseUrl()).toBe("http://localhost:3001");
      if (origRedirect !== undefined) process.env.PAYMENT_REDIRECT_URL = origRedirect;
      if (origApi !== undefined) process.env.API_URL = origApi;
      if (origNextApi !== undefined) process.env.NEXT_PUBLIC_API_URL = origNextApi;
    });
  });
});
