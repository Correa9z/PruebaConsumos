import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { getProducts } from "../application/use-cases/get-products";
import { productRepository } from "../infrastructure/prisma/repositories";

@Controller("products")
export class ProductsController {
  @Get()
  async get() {
    const result = await getProducts(productRepository);
    if (!result.success) {
      throw new HttpException({ error: result.error }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.data;
  }
}
