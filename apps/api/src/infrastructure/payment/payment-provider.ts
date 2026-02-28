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
        ...(params.acceptPersonalAuth && { accept_personal_auth: params.acceptPersonalAuth }),
        amount_in_cents: params.amountInCents,
        currency: "COP",
        customer_email: params.customerEmail,
        payment_method: {
          type: params.paymentMethod.type,
          token: params.paymentMethod.token,
          installments: params.paymentMethod.installments ?? 1,
        },
        payment_method_type: "CARD",
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
      const rawText = await res.text();
      let data: { data?: { id?: string; status?: string }; error?: unknown } = {};
      try {
        data = JSON.parse(rawText) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        const err = data.error;
        const msg =
          typeof err === "string"
            ? err
            : err && typeof err === "object" && err !== null && "reason" in err
              ? String((err as { reason?: string }).reason)
              : err && typeof err === "object" && err !== null && "message" in err
                ? String((err as { message?: string }).message)
                : rawText && rawText.length < 500
                  ? rawText
                  : `Wompi error ${res.status}`;
        return { ok: false, error: msg };
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

  async createPaymentLink(params: import("@/application/ports").PaymentLinkParams) {
    if (!PRIVATE_KEY) return { ok: false, error: "PAYMENT_PRIVATE_KEY not configured" };
    const BASE = BASE_URL.replace(/\/$/, "");
    try {
      const body = {
        name: params.name,
        description: params.description,
        single_use: true,
        collect_shipping: false,
        currency: "COP",
        amount_in_cents: params.amountInCents,
        redirect_url: params.redirectUrl,
        sku: params.reference.slice(0, 36),
        ...(params.expiresAt && { expires_at: params.expiresAt }),
      };
      const res = await fetch(`${BASE}/payment_links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PRIVATE_KEY}`,
          "User-Agent": "WompiTest/1.0",
        },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      let data: { data?: { id?: string }; error?: unknown } = {};
      try {
        data = JSON.parse(rawText) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        const err = data.error;
        const msg =
          typeof err === "string"
            ? err
            : err && typeof err === "object" && err !== null && "reason" in err
              ? String((err as { reason?: string }).reason)
              : rawText && rawText.length < 500
                ? rawText
                : `Wompi payment link error ${res.status}`;
        return { ok: false, error: msg };
      }
      const linkId = data.data?.id;
      if (!linkId) return { ok: false, error: "No payment link id in response" };
      const paymentLinkUrl = `https://checkout.wompi.co/l/${linkId}`;
      return { ok: true, paymentLinkUrl, linkId };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Payment link request failed",
      };
    }
  },
};
