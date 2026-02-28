import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/application/use-cases/create-payment";
import {
  productRepository,
  transactionRepository,
  customerRepository,
  deliveryRepository,
  paymentProviderAdapter,
} from "@/infrastructure";
import {
  getBaseFeeCents,
  getDeliveryFeeCents,
  buildSignature,
  generateTransactionNumber,
} from "@/config/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
    return NextResponse.json(
      {
        error:
          "Missing required fields: productId, quantity, amountInCents, customerEmail, customerFullName, delivery (address, city, phone), acceptanceToken, paymentMethodToken",
      },
      { status: 400 }
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
    }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    transactionNumber: result.data.transaction.transactionNumber,
    transactionId: result.data.transaction.id,
    status: result.data.transaction.status,
    totalInCents: result.data.transaction.totalInCents,
    quantity: result.data.transaction.quantity,
    providerTransactionId: result.data.providerTransactionId,
  });
}
