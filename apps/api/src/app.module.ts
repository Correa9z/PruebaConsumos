import { Module } from "@nestjs/common";
import { HealthController } from "./controllers/health.controller";
import { ProductsController } from "./controllers/products.controller";
import { ConfigController } from "./controllers/config.controller";
import { WompiController } from "./controllers/wompi.controller";
import { PaymentsController } from "./controllers/payments.controller";
import { WebhooksController } from "./controllers/webhooks.controller";
import { TransactionsController } from "./controllers/transactions.controller";
import { OpenapiController } from "./controllers/openapi.controller";

@Module({
  imports: [],
  controllers: [
    HealthController,
    ProductsController,
    ConfigController,
    WompiController,
    PaymentsController,
    WebhooksController,
    TransactionsController,
    OpenapiController,
  ],
})
export class AppModule {}
