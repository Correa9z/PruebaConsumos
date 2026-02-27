import type { Product } from "@/types";

const placeholder = (id: string, w = 400, h = 300) =>
  `https://picsum.photos/seed/${id}/${w}/${h}`;

export const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Camiseta Básica", description: "Camiseta en algodón 100%, cómoda y fresca. Talla única, corte regular. Ideal para uso diario o deporte ligero. Lavable a máquina.", priceInCents: 25000, stock: 10, imageUrls: [placeholder("camiseta1"), placeholder("camiseta2"), placeholder("camiseta3")] },
  { id: "2", name: "Pantalón Jean", description: "Jean clásico azul de corte recto. Tela resistente y cómoda. Versátil para combinar con cualquier look casual.", priceInCents: 85000, stock: 5, imageUrls: [placeholder("jean1"), placeholder("jean2")] },
  { id: "3", name: "Zapatos Deportivos", description: "Calzado running ligero, suela antideslizante y amortiguación. Diseño ergonómico para mayor comodidad en cada paso.", priceInCents: 120000, stock: 8, imageUrls: [placeholder("zapato1"), placeholder("zapato2"), placeholder("zapato3")] },
  { id: "4", name: "Bolso Tote", description: "Bolso tote en tela resistente, ideal para el día a día. Compartimento principal amplio y bolsillo interior. Asas reforzadas.", priceInCents: 45000, stock: 12, imageUrls: [placeholder("bolso1"), placeholder("bolso2")] },
  { id: "5", name: "Gorra", description: "Gorra ajustable, unicolor. Visera recta y cierre trasero para adaptarse a tu medida. Perfecta para sol o estilo urbano.", priceInCents: 18000, stock: 20, imageUrls: [placeholder("gorra1")] },
];

export const MOCK_CONFIG = {
  baseFeeInCents: 500,
  deliveryFeeInCents: 1500,
};
