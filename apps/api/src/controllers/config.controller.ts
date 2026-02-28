import { Controller, Get } from "@nestjs/common";
import { getBaseFeeCents, getDeliveryFeeCents } from "../config/constants";

const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL ?? "";
const PAYMENT_PUBLIC_KEY = process.env.PAYMENT_PUBLIC_KEY ?? "";

@Controller("config")
export class ConfigController {
  @Get()
  get() {
    const payload: Record<string, unknown> = {
      baseFeeInCents: getBaseFeeCents(),
      deliveryFeeInCents: getDeliveryFeeCents(),
    };
    if (PAYMENT_PUBLIC_KEY && PAYMENT_BASE_URL) {
      payload.wompiPublicKey = PAYMENT_PUBLIC_KEY;
      payload.wompiBaseUrl = PAYMENT_BASE_URL.replace(/\/$/, "");
    }
    return payload;
  }
}
