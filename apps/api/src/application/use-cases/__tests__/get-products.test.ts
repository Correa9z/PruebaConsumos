import { getProducts } from "../get-products";
import type { IProductRepository } from "../../ports";
import type { ProductEntity } from "@/domain/entities";

describe("getProducts", () => {
  const mockProducts: ProductEntity[] = [
    {
      id: "1",
      name: "Product A",
      description: "Desc A",
      priceInCents: 1000,
      stock: 5,
      imageUrls: [],
    },
  ];

  it("returns ok with products from repo", async () => {
    const productRepo: IProductRepository = {
      findAll: jest.fn().mockResolvedValue(mockProducts),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    const result = await getProducts(productRepo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockProducts);
    }
    expect(productRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it("returns err when repo throws", async () => {
    const productRepo: IProductRepository = {
      findAll: jest.fn().mockRejectedValue(new Error("DB error")),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    const result = await getProducts(productRepo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("DB error");
    }
  });

  it("returns err message when repo throws non-Error", async () => {
    const productRepo: IProductRepository = {
      findAll: jest.fn().mockRejectedValue("string error"),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    const result = await getProducts(productRepo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to fetch products");
    }
  });
});
