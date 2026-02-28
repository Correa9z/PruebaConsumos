import { NextResponse } from "next/server";

const BASE_URL = process.env.PAYMENT_BASE_URL ?? "";
const PUBLIC_KEY = process.env.PAYMENT_PUBLIC_KEY ?? "";

export const dynamic = "force-dynamic";

/**
 * GET /api/wompi/merchant — tokens de aceptación y permalinks (términos, datos personales).
 */
export async function GET() {
  if (!PUBLIC_KEY || !BASE_URL) {
    return NextResponse.json(
      { error: "Wompi not configured (PAYMENT_PUBLIC_KEY / PAYMENT_BASE_URL)" },
      { status: 503 }
    );
  }
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/merchants/${PUBLIC_KEY}`, {
      headers: { Authorization: `Bearer ${PUBLIC_KEY}` },
    });
    const data = (await res.json()) as {
      data?: {
        presigned_acceptance?: { acceptance_token: string; permalink: string; type: string };
        presigned_personal_data_auth?: { acceptance_token: string; permalink: string; type: string };
      };
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error ?? "Merchant request failed" },
        { status: res.status }
      );
    }
    const policy = data.data?.presigned_acceptance;
    const personal = data.data?.presigned_personal_data_auth;
    return NextResponse.json({
      acceptanceToken: policy?.acceptance_token ?? null,
      acceptPersonalAuth: personal?.acceptance_token ?? null,
      permalinkPolicy: policy?.permalink ?? null,
      permalinkPersonalData: personal?.permalink ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Merchant request failed" },
      { status: 502 }
    );
  }
}
