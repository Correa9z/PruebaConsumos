import { PrismaClient } from "@prisma/client";
import type {
  ProductEntity,
  TransactionEntity,
  CustomerEntity,
  DeliveryEntity,
} from "@/domain/entities";
import type {
  IProductRepository,
  ITransactionRepository,
  ICustomerRepository,
  IDeliveryRepository,
  CreateTransactionData,
  CreateDeliveryData,
} from "@/application/ports";

const prisma = new PrismaClient();

function mapProduct(p: {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrls: string[];
}): ProductEntity {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceInCents: p.priceInCents,
    stock: p.stock,
    imageUrls: p.imageUrls ?? [],
  };
}

function mapTransaction(t: {
  id: string;
  transactionNumber: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  status: string;
  providerTransactionId: string | null;
  wompiPaymentLinkId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TransactionEntity {
  return {
    id: t.id,
    transactionNumber: t.transactionNumber,
    productId: t.productId,
    customerId: t.customerId,
    deliveryId: t.deliveryId,
    quantity: t.quantity,
    amountInCents: t.amountInCents,
    baseFeeInCents: t.baseFeeInCents,
    deliveryFeeInCents: t.deliveryFeeInCents,
    totalInCents: t.totalInCents,
    status: t.status as TransactionEntity["status"],
    providerTransactionId: t.providerTransactionId,
    wompiPaymentLinkId: t.wompiPaymentLinkId ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export const productRepository: IProductRepository = {
  async findAll() {
    const list = await prisma.product.findMany({ orderBy: { name: "asc" } });
    return list.map(mapProduct);
  },
  async findById(id) {
    const p = await prisma.product.findUnique({ where: { id } });
    return p ? mapProduct(p) : null;
  },
  async updateStock(id, newStock) {
    const p = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
    return mapProduct(p);
  },
};

export const transactionRepository: ITransactionRepository = {
  async create(data: CreateTransactionData) {
    const t = await prisma.transaction.create({
      data: {
        transactionNumber: data.transactionNumber,
        productId: data.productId,
        customerId: data.customerId,
        deliveryId: data.deliveryId,
        quantity: data.quantity,
        amountInCents: data.amountInCents,
        baseFeeInCents: data.baseFeeInCents,
        deliveryFeeInCents: data.deliveryFeeInCents,
        totalInCents: data.totalInCents,
      },
    });
    return mapTransaction(t);
  },
  async findByTransactionNumber(transactionNumber: string) {
    const t = await prisma.transaction.findUnique({
      where: { transactionNumber },
    });
    return t ? mapTransaction(t) : null;
  },
  async findById(id: string) {
    const t = await prisma.transaction.findUnique({ where: { id } });
    return t ? mapTransaction(t) : null;
  },
  async findByProviderTransactionId(providerTransactionId: string) {
    const t = await prisma.transaction.findFirst({
      where: { providerTransactionId },
    });
    return t ? mapTransaction(t) : null;
  },
  async updateStatus(id, status, providerTransactionId) {
    const t = await prisma.transaction.update({
      where: { id },
      data: { status, ...(providerTransactionId != null && { providerTransactionId }) },
    });
    return mapTransaction(t);
  },
  async updateProviderId(id, providerTransactionId) {
    const t = await prisma.transaction.update({
      where: { id },
      data: { providerTransactionId },
    });
    return mapTransaction(t);
  },
  async findByWompiPaymentLinkId(wompiPaymentLinkId: string) {
    const t = await prisma.transaction.findFirst({
      where: { wompiPaymentLinkId } as object,
    });
    return t ? mapTransaction(t) : null;
  },
  async updateWompiPaymentLinkId(id, wompiPaymentLinkId) {
    const t = await prisma.transaction.update({
      where: { id },
      data: { wompiPaymentLinkId } as object,
    });
    return mapTransaction(t);
  },
};

function mapCustomer(c: { id: string; email: string; fullName: string }): CustomerEntity {
  return { id: c.id, email: c.email, fullName: c.fullName };
}

export const customerRepository: ICustomerRepository = {
  async findOrCreate(email, fullName) {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return mapCustomer(existing);
    const created = await prisma.customer.create({ data: { email, fullName } });
    return mapCustomer(created);
  },
};

function mapDelivery(d: {
  id: string;
  address: string;
  city: string;
  region: string | null;
  phone: string;
  postalCode: string | null;
}): DeliveryEntity {
  return {
    id: d.id,
    address: d.address,
    city: d.city,
    region: d.region,
    phone: d.phone,
    postalCode: d.postalCode,
  };
}

export const deliveryRepository: IDeliveryRepository = {
  async create(data: CreateDeliveryData) {
    const d = await prisma.delivery.create({
      data: {
        address: data.address,
        city: data.city,
        region: data.region ?? null,
        phone: data.phone,
        postalCode: data.postalCode ?? null,
      },
    });
    return mapDelivery(d);
  },
};

export { prisma };
