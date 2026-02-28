import {
  luhnCheck,
  detectCardType,
  formatCardNumber,
  formatExpiry,
  formatCvc,
} from "../cardValidation";

describe("cardValidation", () => {
  describe("luhnCheck", () => {
    it("returns true for valid Visa test number", () => {
      expect(luhnCheck("4111111111111111")).toBe(true);
    });
    it("returns true for valid number with spaces", () => {
      expect(luhnCheck("4111 1111 1111 1111")).toBe(true);
    });
    it("returns false for invalid check digit", () => {
      expect(luhnCheck("4111111111111112")).toBe(false);
    });
    it("returns false for too short", () => {
      expect(luhnCheck("123456789012")).toBe(false);
    });
    it("returns false for too long", () => {
      expect(luhnCheck("41111111111111111111")).toBe(false);
    });
  });

  describe("detectCardType", () => {
    it("returns visa for 4xxx", () => {
      expect(detectCardType("4111111111111111")).toBe("visa");
      expect(detectCardType("4")).toBe("visa");
    });
    it("returns mastercard for 51-55", () => {
      expect(detectCardType("5111111111111111")).toBe("mastercard");
      expect(detectCardType("5500000000000004")).toBe("mastercard");
    });
    it("returns null for unknown", () => {
      expect(detectCardType("3111111111111111")).toBe(null);
    });
  });

  describe("formatCardNumber", () => {
    it("formats with spaces every 4 digits", () => {
      expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    });
    it("strips non-digits", () => {
      expect(formatCardNumber("4111-1111-1111-1111")).toBe("4111 1111 1111 1111");
    });
    it("limits to 16 digits", () => {
      expect(formatCardNumber("41111111111111111234").length).toBeLessThanOrEqual(19);
    });
  });

  describe("formatExpiry", () => {
    it("adds slash after 2 digits", () => {
      expect(formatExpiry("12")).toBe("12");
      expect(formatExpiry("123")).toBe("12/3");
      expect(formatExpiry("1234")).toBe("12/34");
    });
  });

  describe("formatCvc", () => {
    it("strips non-digits and limits to 4", () => {
      expect(formatCvc("123")).toBe("123");
      expect(formatCvc("1234")).toBe("1234");
      expect(formatCvc("12345")).toBe("1234");
    });
  });
});
