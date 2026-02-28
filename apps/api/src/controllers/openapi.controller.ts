import { Controller, Get } from "@nestjs/common";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API Prueba",
    description:
      "API para listar productos, crear pagos y recibir webhooks del proveedor de pagos.",
    version: "0.0.1",
  },
  servers: [{ url: "/api", description: "API base" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        operationId: "getHealth",
        responses: { "200": { description: "OK" } },
      },
    },
    "/products": {
      get: {
        summary: "Listar productos",
        operationId: "getProducts",
        responses: { "200": { description: "Lista de productos" } },
      },
    },
    "/config": {
      get: {
        summary: "Configuración de fees",
        operationId: "getConfig",
        responses: { "200": { description: "Configuración" } },
      },
    },
    "/payments": {
      post: {
        summary: "Crear pago",
        operationId: "createPayment",
        responses: { "200": { description: "Pago creado" }, "400": { description: "Error" } },
      },
    },
    "/webhooks/payment": {
      post: {
        summary: "Webhook de pago",
        operationId: "webhookPayment",
        responses: { "200": { description: "Evento procesado" } },
      },
    },
  },
};

@Controller("openapi")
export class OpenapiController {
  @Get()
  get() {
    return openApiSpec;
  }
}
