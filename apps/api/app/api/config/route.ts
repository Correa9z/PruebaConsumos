import { NextResponse } from "next/server";
import { getBaseFeeCents, getDeliveryFeeCents } from "@/config/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    baseFeeInCents: getBaseFeeCents(),
    deliveryFeeInCents: getDeliveryFeeCents(),
  });
}
