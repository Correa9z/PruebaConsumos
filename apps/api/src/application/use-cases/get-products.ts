import type { IProductRepository } from "../ports";
import type { ProductEntity } from "@/domain/entities";
import { ok, err, type Result } from "../rop";

export async function getProducts(
  productRepo: IProductRepository
): Promise<Result<ProductEntity[]>> {
  try {
    const products = await productRepo.findAll();
    return ok(products);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to fetch products");
  }
}
