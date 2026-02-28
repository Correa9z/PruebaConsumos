import { Controller, Get, Post, Body, Query, Res, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { createPayment } from "../application/use-cases/create-payment";
import { createPaymentLink } from "../application/use-cases/create-payment-link";
import {
  productRepository,
  transactionRepository,
  customerRepository,
  deliveryRepository,
  paymentProviderAdapter,
} from "../infrastructure";
import {
  getBaseFeeCents,
  getDeliveryFeeCents,
  buildSignature,
  generateTransactionNumber,
  getRedirectBaseUrl,
  getPaymentRedirectBaseUrl,
} from "../config/constants";

const FRONTEND_URL = process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

@Controller("payments")
export class PaymentsController {
  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const b = body as {
      productId?: string;
      quantity?: number;
      amountInCents?: number;
      baseFeeInCents?: number;
      deliveryFeeInCents?: number;
      customerEmail?: string;
      customerFullName?: string;
      delivery?: {
        address?: string;
        city?: string;
        region?: string;
        phone?: string;
        postalCode?: string;
      };
      acceptanceToken?: string;
      acceptPersonalAuth?: string;
      paymentMethodToken?: string;
    };

    if (
      !b.productId ||
      typeof b.quantity !== "number" ||
      b.quantity < 1 ||
      typeof b.amountInCents !== "number" ||
      !b.customerEmail ||
      !b.customerFullName ||
      !b.delivery?.address ||
      !b.delivery?.city ||
      !b.delivery?.phone ||
      !b.acceptanceToken ||
      !b.paymentMethodToken
    ) {
      throw new HttpException(
        {
          error:
            "Missing required fields: productId, quantity, amountInCents, customerEmail, customerFullName, delivery (address, city, phone), acceptanceToken, paymentMethodToken",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const baseFee = b.baseFeeInCents ?? getBaseFeeCents();
    const deliveryFee = b.deliveryFeeInCents ?? getDeliveryFeeCents();

    const result = await createPayment(
      {
        productId: b.productId,
        quantity: b.quantity,
        amountInCents: b.amountInCents,
        baseFeeInCents: baseFee,
        deliveryFeeInCents: deliveryFee,
        customerEmail: b.customerEmail,
        customerFullName: b.customerFullName,
        delivery: {
          address: b.delivery.address,
          city: b.delivery.city,
          region: b.delivery.region,
          phone: b.delivery.phone,
          postalCode: b.delivery.postalCode,
        },
        acceptanceToken: b.acceptanceToken,
        acceptPersonalAuth: b.acceptPersonalAuth,
        paymentMethodToken: b.paymentMethodToken,
      },
      {
        productRepo: productRepository,
        transactionRepo: transactionRepository,
        customerRepo: customerRepository,
        deliveryRepo: deliveryRepository,
        paymentProvider: paymentProviderAdapter,
        generateTransactionNumber,
        buildSignature,
      },
    );

    if (!result.success) {
      throw new HttpException({ error: result.error }, HttpStatus.BAD_REQUEST);
    }

    return {
      transactionNumber: result.data.transaction.transactionNumber,
      transactionId: result.data.transaction.id,
      status: result.data.transaction.status,
      totalInCents: result.data.transaction.totalInCents,
      quantity: result.data.transaction.quantity,
      providerTransactionId: result.data.providerTransactionId,
    };
  }

  @Post("create-link")
  async createLink(@Body() body: Record<string, unknown>) {
    const b = body as {
      productId?: string;
      quantity?: number;
      baseFeeInCents?: number;
      deliveryFeeInCents?: number;
      customerEmail?: string;
      customerFullName?: string;
      delivery?: {
        address?: string;
        city?: string;
        region?: string;
        phone?: string;
        postalCode?: string;
      };
    };

    if (
      !b.productId ||
      typeof b.quantity !== "number" ||
      b.quantity < 1 ||
      !b.customerEmail ||
      !b.customerFullName ||
      !b.delivery?.address ||
      !b.delivery?.city ||
      !b.delivery?.phone
    ) {
      throw new HttpException(
        {
          error:
            "Missing required fields: productId, quantity, customerEmail, customerFullName, delivery (address, city, phone)",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const product = await productRepository.findById(b.productId);
    if (!product) {
      throw new HttpException({ error: "Product not found" }, HttpStatus.NOT_FOUND);
    }

    const amountInCents = product.priceInCents * b.quantity;
    const baseFee = b.baseFeeInCents ?? getBaseFeeCents();
    const deliveryFee = b.deliveryFeeInCents ?? getDeliveryFeeCents();

    const result = await createPaymentLink(
      {
        productId: b.productId,
        quantity: b.quantity,
        amountInCents,
        baseFeeInCents: baseFee,
        deliveryFeeInCents: deliveryFee,
        customerEmail: b.customerEmail,
        customerFullName: b.customerFullName,
        delivery: {
          address: b.delivery.address,
          city: b.delivery.city,
          region: b.delivery.region,
          phone: b.delivery.phone,
          postalCode: b.delivery.postalCode,
        },
      },
      {
        productRepo: productRepository,
        transactionRepo: transactionRepository,
        customerRepo: customerRepository,
        deliveryRepo: deliveryRepository,
        paymentProvider: paymentProviderAdapter,
        generateTransactionNumber,
        getRedirectBaseUrl,
        getPaymentRedirectBaseUrl,
      },
    );

    if (!result.success) {
      throw new HttpException({ error: result.error }, HttpStatus.BAD_REQUEST);
    }

    return {
      transactionId: result.data.transaction.id,
      transactionNumber: result.data.transactionNumber,
      paymentLinkUrl: result.data.paymentLinkUrl,
    };
  }

  @Get("wompi-redirect")
  wompiRedirect(@Query() query: Record<string, string>, @Res() res: Response) {
    const base = FRONTEND_URL.replace(/\/$/, "");
    const redirectTo = new URL("/resultado-pago", base);
    for (const [key, value] of Object.entries(query)) {
      redirectTo.searchParams.set(key, value);
    }
    return res.redirect(302, redirectTo.toString());
  }
}
