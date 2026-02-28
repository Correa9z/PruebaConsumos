import type { Product, Config } from "@/types";

const API = "/api";

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API}/products`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function getConfig(): Promise<Config> {
  const res = await fetch(`${API}/config`);
  if (!res.ok) throw new Error("Failed to load configuration");
  return res.json();
}

export interface WompiMerchantResponse {
  acceptanceToken: string | null;
  acceptPersonalAuth: string | null;
  permalinkPolicy: string | null;
  permalinkPersonalData: string | null;
}

export async function getWompiMerchant(): Promise<WompiMerchantResponse> {
  const res = await fetch(`${API}/wompi/merchant`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to load Wompi acceptance");
  }
  return res.json();
}

export interface TokenizeCardParams {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

/**
 * Tokeniza la tarjeta en Wompi (desde el frontend; los datos no pasan por nuestro servidor).
 * Requiere wompiBaseUrl y wompiPublicKey del config.
 */
export async function tokenizeCard(
  wompiBaseUrl: string,
  wompiPublicKey: string,
  card: TokenizeCardParams
): Promise<string> {
  const number = card.number.replace(/\s/g, "");
  const res = await fetch(`${wompiBaseUrl}/tokens/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wompiPublicKey}`,
    },
    body: JSON.stringify({
      number,
      cvc: card.cvc,
      exp_month: card.expMonth.padStart(2, "0"),
      exp_year: card.expYear.padStart(2, "0"),
      card_holder: card.cardHolder,
    }),
  });
  const data = (await res.json()) as {
    data?: { id?: string };
    error?: { reason?: string };
  };
  if (!res.ok) {
    const msg = data.error?.reason ?? (data as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  const token = data.data?.id;
  if (!token) throw new Error("Card token not received");
  return token;
}

export interface CreatePaymentParams {
  productId: string;
  quantity: number;
  amountInCents: number;
  baseFeeInCents?: number;
  deliveryFeeInCents?: number;
  customerEmail: string;
  customerFullName: string;
  delivery: {
    address: string;
    city: string;
    region?: string;
    phone: string;
    postalCode?: string;
  };
  acceptanceToken: string;
  acceptPersonalAuth?: string;
  paymentMethodToken: string;
}

export interface CreatePaymentResponse {
  transactionNumber: string;
  transactionId: string;
  status: string;
  totalInCents: number;
  quantity: number;
  providerTransactionId?: string;
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: params.productId,
      quantity: params.quantity,
      amountInCents: params.amountInCents,
      baseFeeInCents: params.baseFeeInCents,
      deliveryFeeInCents: params.deliveryFeeInCents,
      customerEmail: params.customerEmail,
      customerFullName: params.customerFullName,
      delivery: params.delivery,
      acceptanceToken: params.acceptanceToken,
      acceptPersonalAuth: params.acceptPersonalAuth,
      paymentMethodToken: params.paymentMethodToken,
    }),
  });
  const data = (await res.json()) as CreatePaymentResponse & { error?: string | { message?: string; reason?: string } };
  if (!res.ok) {
    const raw = data.error;
    const msg =
      typeof raw === "string"
        ? raw
        : raw?.message ?? (raw as { reason?: string } | undefined)?.reason ?? "Failed to create payment";
    throw new Error(msg);
  }
  return data;
}

export interface CreatePaymentLinkParams {
  productId: string;
  quantity: number;
  baseFeeInCents?: number;
  deliveryFeeInCents?: number;
  customerEmail: string;
  customerFullName: string;
  delivery: {
    address: string;
    city: string;
    region?: string;
    phone: string;
    postalCode?: string;
  };
}

export interface CreatePaymentLinkResponse {
  transactionId: string;
  transactionNumber: string;
  paymentLinkUrl: string;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<CreatePaymentLinkResponse> {
  const res = await fetch(`${API}/payments/create-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: params.productId,
      quantity: params.quantity,
      baseFeeInCents: params.baseFeeInCents,
      deliveryFeeInCents: params.deliveryFeeInCents,
      customerEmail: params.customerEmail,
      customerFullName: params.customerFullName,
      delivery: params.delivery,
    }),
  });
  const data = (await res.json()) as CreatePaymentLinkResponse & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to create payment link");
  return data;
}

export interface TransactionStatusResponse {
  status: string;
  transactionNumber: string;
}

/**
 * Obtiene el estado actual de una transacción por el id de Wompi (providerTransactionId).
 * Útil para la página de resultado tras redirect o aprobación manual.
 */
export async function getTransactionStatus(
  providerId: string
): Promise<TransactionStatusResponse | null> {
  const res = await fetch(
    `${API}/transactions/status?providerId=${encodeURIComponent(providerId)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}
