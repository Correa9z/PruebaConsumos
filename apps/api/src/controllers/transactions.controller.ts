import { Controller, Get, Query, HttpException, HttpStatus } from "@nestjs/common";
import { transactionRepository } from "../infrastructure";

@Controller("transactions")
export class TransactionsController {
  @Get("status")
  async getStatus(@Query("providerId") providerId: string | undefined) {
    if (!providerId?.trim()) {
      throw new HttpException(
        { error: "Missing providerId" },
        HttpStatus.BAD_REQUEST,
      );
    }

    const transaction = await transactionRepository.findByProviderTransactionId(
      providerId.trim(),
    );
    if (!transaction) {
      throw new HttpException(
        { error: "Transaction not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      status: transaction.status,
      transactionNumber: transaction.transactionNumber,
    };
  }
}
