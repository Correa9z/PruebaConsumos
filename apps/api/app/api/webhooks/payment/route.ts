import { NextRequest, NextResponse } from "next/server";
import { updateTransactionFromWebhook } from "@/application/use-cases/update-transaction-webhook";
import { transactionRepository, productRepository } from "@/infrastructure";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body as {
    data?: { transaction?: { id?: string; status?: string } };
  };
  const providerId = event.data?.transaction?.id;
  const status = event.data?.transaction?.status;

  if (!providerId || !status) {
    return NextResponse.json(
      { error: "Missing data.transaction.id or status" },
      { status: 400 }
    );
  }

  const statusUpper = status.toUpperCase();
  if (
    statusUpper !== "APPROVED" &&
    statusUpper !== "DECLINED" &&
    statusUpper !== "ERROR"
  ) {
    return NextResponse.json({ received: true });
  }

  const result = await updateTransactionFromWebhook(
    providerId,
    statusUpper as "APPROVED" | "DECLINED" | "ERROR",
    { transactionRepo: transactionRepository, productRepo: productRepository }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, transactionId: result.data.id });
}
