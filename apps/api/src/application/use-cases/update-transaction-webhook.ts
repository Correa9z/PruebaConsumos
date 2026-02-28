import type { ITransactionRepository, IProductRepository } from "../ports";
import type { TransactionEntity } from "@/domain/entities";
import { ok, err, type Result } from "../rop";

export async function updateTransactionFromWebhook(
  providerTransactionId: string,
  status: "APPROVED" | "DECLINED" | "ERROR",
  deps: {
    transactionRepo: ITransactionRepository;
    productRepo: IProductRepository;
  }
): Promise<Result<TransactionEntity, string>> {
  const transaction = await deps.transactionRepo.findByProviderTransactionId(
    providerTransactionId
  );
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
