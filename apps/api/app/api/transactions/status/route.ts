import { NextRequest, NextResponse } from "next/server";
import { transactionRepository } from "@/infrastructure";

export const dynamic = "force-dynamic";

/**
 * GET /api/transactions/status?providerId=xxx
 * Devuelve el estado y número de transacción por id del proveedor (Wompi).
 */
export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get("providerId");
  if (!providerId?.trim()) {
    return NextResponse.json(
      { error: "Missing providerId" },
      { status: 400 }
    );
  }

  const transaction = await transactionRepository.findByProviderTransactionId(
    providerId.trim()
  );
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: transaction.status,
    transactionNumber: transaction.transactionNumber,
  });
}
