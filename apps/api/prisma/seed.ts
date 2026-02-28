import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const envPath = path.resolve(process.cwd(), ".env");
const envPathFromRoot = path.resolve(process.cwd(), "apps", "api", ".env");
config({ path: envPath });
if (!process.env.DATABASE_URL) config({ path: envPathFromRoot });

const prisma = new PrismaClient();

// Imágenes por producto (Unsplash, uso libre). Formato: w=400&h=300&fit=crop
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop`;

const PRODUCTS = [
  {
    name: "Camiseta Básica",
    description: "Camiseta en algodón 100%, cómoda y fresca. Talla única, corte regular.",
    priceInCents: 2500000,
    stock: 10,
    imageUrls: [
      img("1603113730470-780cbb2f32ca"), // camiseta blanca
      img("1521572163474-6864f9cf17ab"), // camiseta
      img("1622445273715-2f4ec2a1d75a"), // camiseta gris
    ],
  },
  {
    name: "Pantalón Jean",
    description: "Jean clásico azul de corte recto. Tela resistente y cómoda.",
    priceInCents: 8500000,
    stock: 5,
    imageUrls: [
      img("1541099649105-f68ad6f294f8"), // jeans
      img("1594938298603-c8148c4dae35"), // jeans detalle
    ],
  },
  {
    name: "Zapatos Deportivos",
    description: "Calzado running ligero, suela antideslizante y amortiguación.",
    priceInCents: 12000000,
    stock: 8,
    imageUrls: [
      img("1542291026-7eec264c27ff"), // sneakers
      img("1600185365926-3a2ce3cdb9eb"), // zapatilla
      img("1595950653106-6c9eb79f2e6a"), // tenis
    ],
  },
  {
    name: "Bolso Tote",
    description: "Bolso tote en tela resistente, ideal para el día a día.",
    priceInCents: 4500000,
    stock: 12,
    imageUrls: [
      img("1584917865442-de89df76afd3"), // tote
      img("1553062407-98eeb64c6a62"),   // bolso
    ],
  },
  {
    name: "Gorra",
    description: "Gorra ajustable, unicolor. Visera recta y cierre trasero.",
    priceInCents: 1800000,
    stock: 20,
    imageUrls: [
      img("1588850561407-ed78c282e89b"), // gorra
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
