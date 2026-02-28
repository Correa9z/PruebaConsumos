import type { ITransactionRepository, IProductRepository } from "../ports";
import type { TransactionEntity } from "@/domain/entities";
import { ok, err, type Result } from "../rop";

/**
 * Actualiza la transacción desde el webhook de Wompi. Busca por providerId, paymentLinkId o reference.
 */
export async function updateTransactionFromWebhook(
  providerTransactionId: string,
  status: "APPROVED" | "DECLINED" | "ERROR",
  deps: {
    transactionRepo: ITransactionRepository;
    productRepo: IProductRepository;
  },
  options?: { reference?: string; paymentLinkId?: string }
): Promise<Result<TransactionEntity, string>> {
  let transaction = await deps.transactionRepo.findByProviderTransactionId(
    providerTransactionId
  );
  if (!transaction && options?.paymentLinkId) {
    transaction = await deps.transactionRepo.findByWompiPaymentLinkId(options.paymentLinkId);
    if (transaction && !transaction.providerTransactionId) {
      await deps.transactionRepo.updateProviderId(transaction.id, providerTransactionId);
    }
  }
  if (!transaction && options?.reference) {
    transaction = await deps.transactionRepo.findByTransactionNumber(options.reference);
    if (transaction && !transaction.providerTransactionId) {
      await deps.transactionRepo.updateProviderId(transaction.id, providerTransactionId);
    }
  }
  if (!transaction) return err("Transaction not found");

  const updated = await deps.transactionRepo.updateStatus(
    transaction.id,
    status,
    providerTransactionId
  );

  if (status === "APPROVED") {
    const product = await deps.productRepo.findById(transaction.productId);
    if (product && product.stock >= transaction.quantity) {
      await deps.productRepo.updateStock(
        transaction.productId,
        product.stock - transaction.quantity
      );
    }
  }

  return ok(updated);
}
