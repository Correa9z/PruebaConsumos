import { NextResponse } from "next/server";
import { getProducts } from "@/application/use-cases/get-products";
import { productRepository } from "@/infrastructure/prisma/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getProducts(productRepository);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data);
}
