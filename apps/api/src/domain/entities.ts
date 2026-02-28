export type TransactionStatus = "PENDING" | "APPROVED" | "DECLINED" | "ERROR";

export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrls: string[];
}

export interface CustomerEntity {
  id: string;
  email: string;
  fullName: string;
}

export interface DeliveryEntity {
  id: string;
  address: string;
  city: string;
  region: string | null;
  phone: string;
  postalCode: string | null;
}

export interface TransactionEntity {
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
  status: TransactionStatus;
  providerTransactionId: string | null;
  wompiPaymentLinkId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
