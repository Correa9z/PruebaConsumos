import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";

const BASE_URL = process.env.PAYMENT_BASE_URL ?? "";
const PUBLIC_KEY = process.env.PAYMENT_PUBLIC_KEY ?? "";

@Controller("wompi")
export class WompiController {
  @Get("merchant")
  async getMerchant() {
    if (!PUBLIC_KEY || !BASE_URL) {
      throw new HttpException(
        { error: "Payment provider not configured (PAYMENT_PUBLIC_KEY / PAYMENT_BASE_URL)" },
        HttpStatus.SERVICE_UNAVAILABLE,
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
        throw new HttpException(
          { error: (data as { error?: string }).error ?? "Merchant request failed" },
          res.status as HttpStatus,
        );
      }
      const policy = data.data?.presigned_acceptance;
      const personal = data.data?.presigned_personal_data_auth;
      return {
        acceptanceToken: policy?.acceptance_token ?? null,
        acceptPersonalAuth: personal?.acceptance_token ?? null,
        permalinkPolicy: policy?.permalink ?? null,
        permalinkPersonalData: personal?.permalink ?? null,
      };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(
        { error: e instanceof Error ? e.message : "Merchant request failed" },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
