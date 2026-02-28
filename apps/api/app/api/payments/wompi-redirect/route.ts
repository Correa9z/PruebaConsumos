import { NextRequest, NextResponse } from "next/server";

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

/**
 * Redirect del payment link de Wompi. Redirige al frontend con id y status en query.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const base = FRONTEND_URL.replace(/\/$/, "");
  const redirectTo = new URL("/resultado-pago", base);
  searchParams.forEach((value, key) => {
    redirectTo.searchParams.set(key, value);
  });
  return NextResponse.redirect(redirectTo.toString(), 302);
}
