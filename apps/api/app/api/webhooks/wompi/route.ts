import { NextRequest, NextResponse } from "next/server";
import { updateTransactionFromWebhook } from "@/application/use-cases/update-transaction-webhook";
import { transactionRepository, productRepository } from "@/infrastructure";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Webhook Wompi endpoint. Envía POST con el evento.",
  });
}

/**
 * POST /api/webhooks/wompi
 * Recibe eventos de Wompi (transaction.updated). Acepta data.transaction.* o data.* plano.
 */
export async function POST(request: NextRequest) {
  let payloadJson: string;
  try {
    payloadJson = await request.text();
  } catch {
    return NextResponse.json({ error: "Error reading body" }, { status: 400 });
  }

  if (!payloadJson?.trim()) {
    return NextResponse.json({ error: "Payload vacío" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body.data as Record<string, unknown> | undefined;

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Missing or invalid data" }, { status: 400 });
  }

  const transaction = data.transaction as Record<string, unknown> | undefined;
  const providerId =
    (transaction?.id as string) ?? (data.id as string);
  const status =
    (transaction?.status as string) ?? (data.status as string);
  const reference =
    (transaction?.reference as string) ?? (data.reference as string);
  const paymentLinkId =
    (transaction?.payment_link_id as string) ?? (data.payment_link_id as string);

  if (!providerId || !status) {
    return NextResponse.json(
      { error: "Missing data id or status" },
      { status: 400 }
    );
  }

  const statusUpper = String(status).toUpperCase();
  if (
    statusUpper !== "APPROVED" &&
    statusUpper !== "DECLINED" &&
    statusUpper !== "ERROR"
  ) {
    return NextResponse.json({ message: "Webhook recibido y procesado" });
  }

  const result = await updateTransactionFromWebhook(
    String(providerId),
    statusUpper as "APPROVED" | "DECLINED" | "ERROR",
    { transactionRepo: transactionRepository, productRepo: productRepository },
    reference || paymentLinkId
      ? { reference: reference ? String(reference) : undefined, paymentLinkId: paymentLinkId ? String(paymentLinkId) : undefined }
      : undefined
  );

  if (!result.success) {
    return NextResponse.json({
      message: "Webhook recibido y procesado",
      warning: result.error,
    });
  }

  return NextResponse.json({
    message: "Webhook recibido y procesado",
    transactionId: result.data.id,
  });
}
