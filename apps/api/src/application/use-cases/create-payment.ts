import type {
  ITransactionRepository,
  ICustomerRepository,
  IDeliveryRepository,
  IProductRepository,
  IPaymentProvider,
  CreateDeliveryData,
} from "../ports";
import type { TransactionEntity, ProductEntity } from "@/domain/entities";
import { ok, err, type Result } from "../rop";

export interface CreatePaymentInput {
  productId: string;
  quantity: number;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  customerEmail: string;
  customerFullName: string;
  delivery: CreateDeliveryData;
  acceptanceToken: string;
  paymentMethodToken: string;
}

export async function createPayment(
  input: CreatePaymentInput,
  deps: {
    productRepo: IProductRepository;
    transactionRepo: ITransactionRepository;
    customerRepo: ICustomerRepository;
    deliveryRepo: IDeliveryRepository;
    paymentProvider: IPaymentProvider;
    generateTransactionNumber: () => string;
    buildSignature: (reference: string, totalCents: number) => string;
  }
): Promise<
  Result<
    { transaction: TransactionEntity; product: ProductEntity; providerTransactionId?: string },
    string
  >
> {
  const product = await deps.productRepo.findById(input.productId);
  if (!product) return err("Product not found");
  if (product.stock < input.quantity) return err("Insufficient stock");

  const customer = await deps.customerRepo.findOrCreate(
    input.customerEmail,
    input.customerFullName
  );
  const delivery = await deps.deliveryRepo.create(input.delivery);

  const transactionNumber = deps.generateTransactionNumber();
  const totalInCents =
    input.amountInCents + input.baseFeeInCents + input.deliveryFeeInCents;
  const signature = deps.buildSignature(transactionNumber, totalInCents);

  const transaction = await deps.transactionRepo.create({
    transactionNumber,
    productId: input.productId,
    customerId: customer.id,
    deliveryId: delivery.id,
    quantity: input.quantity,
    amountInCents: input.amountInCents,
    baseFeeInCents: input.baseFeeInCents,
    deliveryFeeInCents: input.deliveryFeeInCents,
    totalInCents,
  });

  const paymentResult = await deps.paymentProvider.createTransaction({
    acceptanceToken: input.acceptanceToken,
    amountInCents: totalInCents,
    customerEmail: input.customerEmail,
    paymentMethod: { type: "CARD", token: input.paymentMethodToken },
    reference: transactionNumber,
    signature,
  });

  if (!paymentResult.ok) {
    return err(paymentResult.error);
  }

  await deps.transactionRepo.updateProviderId(transaction.id, paymentResult.transactionId);

  return ok({
    transaction,
    product,
    providerTransactionId: paymentResult.transactionId,
  });
}
