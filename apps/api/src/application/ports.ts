import type { ProductEntity, TransactionEntity, CustomerEntity, DeliveryEntity } from "@/domain/entities";

export interface IProductRepository {
  findAll(): Promise<ProductEntity[]>;
  findById(id: string): Promise<ProductEntity | null>;
  updateStock(id: string, newStock: number): Promise<ProductEntity>;
}

export interface ITransactionRepository {
  create(data: CreateTransactionData): Promise<TransactionEntity>;
  findByTransactionNumber(transactionNumber: string): Promise<TransactionEntity | null>;
  findById(id: string): Promise<TransactionEntity | null>;
  findByProviderTransactionId(providerTransactionId: string): Promise<TransactionEntity | null>;
  updateStatus(
    id: string,
    status: TransactionEntity["status"],
    providerTransactionId?: string | null
  ): Promise<TransactionEntity>;
  updateProviderId(id: string, providerTransactionId: string): Promise<TransactionEntity>;
}

export interface CreateTransactionData {
  transactionNumber: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  quantity: number;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

export interface ICustomerRepository {
  findOrCreate(email: string, fullName: string): Promise<CustomerEntity>;
}

export interface IDeliveryRepository {
  create(data: CreateDeliveryData): Promise<DeliveryEntity>;
}

export interface CreateDeliveryData {
  address: string;
  city: string;
  region?: string;
  phone: string;
  postalCode?: string;
}

export interface IPaymentProvider {
  createTransaction(params: PaymentProviderParams): Promise<PaymentProviderResult>;
}

export interface PaymentProviderParams {
  acceptanceToken: string;
  amountInCents: number;
  customerEmail: string;
  paymentMethod: { type: string; token: string; installments?: number };
  reference: string;
  signature: string;
}

export type PaymentProviderResult =
  | { ok: true; transactionId: string; status: string }
  | { ok: false; error: string };
