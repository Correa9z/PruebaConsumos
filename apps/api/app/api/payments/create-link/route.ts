import { NextRequest, NextResponse } from "next/server";
import { createPaymentLink } from "@/application/use-cases/create-payment-link";
import {
  productRepository,
  transactionRepository,
  customerRepository,
  deliveryRepository,
  paymentProviderAdapter,
} from "@/infrastructure";
import { getBaseFeeCents, getDeliveryFeeCents, generateTransactionNumber, getRedirectBaseUrl, getPaymentRedirectBaseUrl } from "@/config/constants";

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
    return NextResponse.json(
      {
        error:
          "Missing required fields: productId, quantity, customerEmail, customerFullName, delivery (address, city, phone)",
      },
      { status: 400 }
    );
  }

  const product = await productRepository.findById(b.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
    }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    transactionId: result.data.transaction.id,
    transactionNumber: result.data.transactionNumber,
    paymentLinkUrl: result.data.paymentLinkUrl,
  });
}
