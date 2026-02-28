import { ok, err } from "../rop";

describe("rop", () => {
  describe("ok", () => {
    it("returns success result with data", () => {
      const result = ok(42);
      expect(result.success).toBe(true);
      expect("data" in result && result.data).toBe(42);
    });

    it("works with objects", () => {
      const result = ok({ id: "1", name: "test" });
      expect(result.success).toBe(true);
      expect("data" in result && result.data).toEqual({ id: "1", name: "test" });
    });
  });

  describe("err", () => {
    it("returns error result with error", () => {
      const result = err("Something failed");
      expect(result.success).toBe(false);
      expect("error" in result && result.error).toBe("Something failed");
    });
  });
});
