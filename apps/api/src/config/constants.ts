import crypto from "crypto";

const BASE_FEE_CENTS = 500;
const DELIVERY_FEE_CENTS = 1500;

export function getBaseFeeCents(): number {
  return BASE_FEE_CENTS;
}

export function getDeliveryFeeCents(): number {
  return DELIVERY_FEE_CENTS;
}

export function buildSignature(reference: string, totalCents: number): string {
  const key = process.env.PAYMENT_INTEGRITY_KEY ?? "";
  if (!key) return reference + totalCents;
  const payload = `${reference}${totalCents}COP${key}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function generateTransactionNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TXN-${t}-${r}`;
}
