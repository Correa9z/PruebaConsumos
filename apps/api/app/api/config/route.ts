import { NextResponse } from "next/server";
import { getBaseFeeCents, getDeliveryFeeCents } from "@/config/constants";

export const dynamic = "force-dynamic";

const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL ?? "";
const PAYMENT_PUBLIC_KEY = process.env.PAYMENT_PUBLIC_KEY ?? "";

export async function GET() {
  const payload: {
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    wompiPublicKey?: string;
    wompiBaseUrl?: string;
  } = {
    baseFeeInCents: getBaseFeeCents(),
    deliveryFeeInCents: getDeliveryFeeCents(),
  };
  if (PAYMENT_PUBLIC_KEY && PAYMENT_BASE_URL) {
    payload.wompiPublicKey = PAYMENT_PUBLIC_KEY;
    payload.wompiBaseUrl = PAYMENT_BASE_URL.replace(/\/$/, "");
  }
  return NextResponse.json(payload);
}
