import { Controller, Get, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { updateTransactionFromWebhook } from "../application/use-cases/update-transaction-webhook";
import { transactionRepository, productRepository } from "../infrastructure";

@Controller("webhooks")
export class WebhooksController {
  @Post("payment")
  async payment(@Body() body: Record<string, unknown>) {
    const event = body as {
      data?: {
        transaction?: { id?: string; status?: string; reference?: string };
      };
    };
    const providerId = event.data?.transaction?.id;
    const status = event.data?.transaction?.status;
    const reference = event.data?.transaction?.reference;

    if (!providerId || !status) {
      throw new HttpException(
        { error: "Missing data.transaction.id or status" },
        HttpStatus.BAD_REQUEST,
      );
    }

    const statusUpper = status.toUpperCase();
    if (statusUpper !== "APPROVED" && statusUpper !== "DECLINED" && statusUpper !== "ERROR") {
      return { received: true };
    }

    const result = await updateTransactionFromWebhook(
      providerId,
      statusUpper as "APPROVED" | "DECLINED" | "ERROR",
      { transactionRepo: transactionRepository, productRepo: productRepository },
      reference ? { reference } : undefined,
    );

    if (!result.success) {
      throw new HttpException({ error: result.error }, HttpStatus.NOT_FOUND);
    }

    return { ok: true, transactionId: result.data.id };
  }

  @Get("wompi")
  wompiGet() {
    return { message: "Webhook Wompi endpoint. Envía POST con el evento." };
  }

  @Post("wompi")
  async wompiPost(@Body() body: Record<string, unknown>) {
    const data = body.data as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") {
      throw new HttpException({ error: "Missing or invalid data" }, HttpStatus.BAD_REQUEST);
    }

    const transaction = data.transaction as Record<string, unknown> | undefined;
    const providerId = (transaction?.id as string) ?? (data.id as string);
    const status = (transaction?.status as string) ?? (data.status as string);
    const reference = (transaction?.reference as string) ?? (data.reference as string);
    const paymentLinkId =
      (transaction?.payment_link_id as string) ?? (data.payment_link_id as string);

    if (!providerId || !status) {
      throw new HttpException(
        { error: "Missing data id or status" },
        HttpStatus.BAD_REQUEST,
      );
    }

    const statusUpper = String(status).toUpperCase();
    if (statusUpper !== "APPROVED" && statusUpper !== "DECLINED" && statusUpper !== "ERROR") {
      return { message: "Webhook recibido y procesado" };
    }

    const result = await updateTransactionFromWebhook(
      String(providerId),
      statusUpper as "APPROVED" | "DECLINED" | "ERROR",
      { transactionRepo: transactionRepository, productRepo: productRepository },
      reference || paymentLinkId
        ? {
            reference: reference ? String(reference) : undefined,
            paymentLinkId: paymentLinkId ? String(paymentLinkId) : undefined,
          }
        : undefined,
    );

    if (!result.success) {
      return { message: "Webhook recibido y procesado", warning: result.error };
    }

    return { message: "Webhook recibido y procesado", transactionId: result.data.id };
  }
}
