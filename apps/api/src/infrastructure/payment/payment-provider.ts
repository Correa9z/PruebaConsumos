import type {
  IPaymentProvider,
  PaymentProviderParams,
  PaymentProviderResult,
} from "@/application/ports";

const BASE_URL = process.env.PAYMENT_BASE_URL ?? "";
const PRIVATE_KEY = process.env.PAYMENT_PRIVATE_KEY ?? "";

export const paymentProviderAdapter: IPaymentProvider = {
  async createTransaction(params: PaymentProviderParams): Promise<PaymentProviderResult> {
    if (!PRIVATE_KEY) {
      return { ok: false, error: "PAYMENT_PRIVATE_KEY not configured" };
    }
    try {
      const body = {
        acceptance_token: params.acceptanceToken,
        amount_in_cents: params.amountInCents,
        currency: "COP",
        customer_email: params.customerEmail,
        payment_method: {
          type: params.paymentMethod.type,
          token: params.paymentMethod.token,
          installments: params.paymentMethod.installments ?? 1,
        },
        reference: params.reference,
        signature: params.signature,
      };
      const res = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PRIVATE_KEY}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        data?: { id?: string; status?: string };
        error?: { reason?: string };
      };
      if (!res.ok) {
        const msg = data.error?.reason ?? (data as { error?: string }).error ?? `HTTP ${res.status}`;
        return { ok: false, error: String(msg) };
      }
      const id = data.data?.id;
      const status = data.data?.status ?? "PENDING";
      if (!id) return { ok: false, error: "No transaction id in response" };
      return { ok: true, transactionId: id, status };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Payment request failed",
      };
    }
  },
};
