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

export interface CreatePaymentLinkInput {
  productId: string;
  quantity: number;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  customerEmail: string;
  customerFullName: string;
  delivery: CreateDeliveryData;
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
  deps: {
    productRepo: IProductRepository;
    transactionRepo: ITransactionRepository;
    customerRepo: ICustomerRepository;
    deliveryRepo: IDeliveryRepository;
    paymentProvider: IPaymentProvider;
    generateTransactionNumber: () => string;
  getRedirectBaseUrl: () => string;
  getPaymentRedirectBaseUrl?: () => string;
}
): Promise<
  Result<
    {
      transaction: TransactionEntity;
      product: ProductEntity;
      paymentLinkUrl: string;
      transactionNumber: string;
    },
    string
  >
> {
  if (!deps.paymentProvider.createPaymentLink) {
    return err("Payment links not supported");
  }

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

  const redirectBase = (deps.getPaymentRedirectBaseUrl ?? deps.getRedirectBaseUrl)();
  const redirectUrl = `${redirectBase.replace(/\/$/, "")}/api/payments/wompi-redirect`;

  const linkResult = await deps.paymentProvider.createPaymentLink({
    name: `Pago ${product.name}`,
    description: `${product.name} x ${input.quantity} - ${transactionNumber}`,
    amountInCents: totalInCents,
    reference: transactionNumber,
    redirectUrl,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"),
  });

  if (!linkResult.ok) return err(linkResult.error);

  await deps.transactionRepo.updateWompiPaymentLinkId(transaction.id, linkResult.linkId);

  return ok({
    transaction,
    product,
    paymentLinkUrl: linkResult.paymentLinkUrl,
    transactionNumber,
  });
}
