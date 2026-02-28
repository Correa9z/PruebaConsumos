import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const envPath = path.resolve(process.cwd(), ".env");
const envPathFromRoot = path.resolve(process.cwd(), "apps", "api", ".env");
config({ path: envPath });
if (!process.env.DATABASE_URL) config({ path: envPathFromRoot });

const prisma = new PrismaClient();

// Product images: Unsplash (w=400&h=300&fit=crop). Broken IDs replaced with Lorem Flickr (product tags, lock=seed for stability).
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop`;
const lf = (tags: string, seed: number) => `https://loremflickr.com/400/300/${tags}?lock=${seed}`;

const PRODUCTS = [
  {
    name: "Basic T-Shirt",
    description: "100% cotton t-shirt, comfortable and breathable. One size, regular fit.",
    priceInCents: 2500000,
    stock: 10,
    imageUrls: [
      u("1521572163474-6864f9cf17ab"),
      u("1603113730470-780cbb2f32ca"),
      lf("tshirt,shirt", 301),
    ],
  },
  {
    name: "Classic Jeans",
    description: "Classic blue straight-cut jeans. Durable and comfortable fabric.",
    priceInCents: 8500000,
    stock: 5,
    imageUrls: [
      lf("jeans,denim", 401),
      u("1594938298603-c8148c4dae35"),
    ],
  },
  {
    name: "Sports Sneakers",
    description: "Lightweight running shoes with non-slip sole and cushioning.",
    priceInCents: 12000000,
    stock: 8,
    imageUrls: [
      u("1542291026-7eec264c27ff"),
      u("1600185365926-3a2ce3cdb9eb"),
      lf("sneakers,shoes", 501),
    ],
  },
  {
    name: "Tote Bag",
    description: "Sturdy tote bag, ideal for everyday use.",
    priceInCents: 4500000,
    stock: 12,
    imageUrls: [
      u("1584917865442-de89df76afd3"),
      u("1553062407-98eeb64c6a62"),
    ],
  },
  {
    name: "Cap",
    description: "Adjustable cap, solid color. Straight visor and back closure.",
    priceInCents: 1800000,
    stock: 20,
    imageUrls: [
      u("1588850561407-ed78c282e89b"),
    ],
  },
];

async function main() {
  const refresh = process.env.REFRESH_PRODUCTS === "1" || process.env.REFRESH_PRODUCTS === "true";
  if (refresh) {
    await prisma.product.deleteMany({});
    console.log("Seed: products deleted, re-creating…");
  } else {
    const count = await prisma.product.count();
    if (count > 0) {
      console.log("Seed: products already exist, skipping (use REFRESH_PRODUCTS=1 to replace)");
      return;
    }
  }
  await prisma.product.createMany({ data: PRODUCTS });
  console.log("Seed: created", PRODUCTS.length, "products");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
