import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API Prueba",
    description:
      "API para listar productos, crear pagos y recibir webhooks del proveedor de pagos (Wompi).",
    version: "0.0.1",
  },
  servers: [{ url: "/api", description: "API base" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Estado del servicio.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    service: { type: "string" },
                    version: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/products": {
      get: {
        summary: "Listar productos",
        description: "Devuelve todos los productos con imagen, precio y stock.",
        operationId: "getProducts",
        responses: {
          "200": {
            description: "Lista de productos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      priceInCents: { type: "integer" },
                      stock: { type: "integer" },
                      imageUrls: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Error interno",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/config": {
      get: {
        summary: "Configuración de fees",
        description: "Fee base y fee de envío en centavos.",
        operationId: "getConfig",
        responses: {
          "200": {
            description: "Configuración",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    baseFeeInCents: { type: "integer" },
                    deliveryFeeInCents: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/payments": {
      post: {
        summary: "Crear pago",
        description:
          "Crea una transacción y la envía al proveedor de pagos. Requiere tokens de aceptación y método de pago (generados en el front con el widget del proveedor).",
        operationId: "createPayment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "productId",
                  "quantity",
                  "amountInCents",
                  "customerEmail",
                  "customerFullName",
                  "delivery",
                  "acceptanceToken",
                  "paymentMethodToken",
                ],
                properties: {
                  productId: { type: "string", description: "ID del producto" },
                  quantity: { type: "integer", minimum: 1 },
                  amountInCents: { type: "integer", description: "Precio unitario × quantity" },
                  baseFeeInCents: { type: "integer", description: "Opcional; si no se envía se usa el del config" },
                  deliveryFeeInCents: { type: "integer", description: "Opcional" },
                  customerEmail: { type: "string", format: "email" },
                  customerFullName: { type: "string" },
                  delivery: {
                    type: "object",
                    required: ["address", "city", "phone"],
                    properties: {
                      address: { type: "string" },
                      city: { type: "string" },
                      region: { type: "string" },
                      phone: { type: "string" },
                      postalCode: { type: "string" },
                    },
                  },
                  acceptanceToken: { type: "string", description: "Token de aceptación del proveedor" },
                  paymentMethodToken: { type: "string", description: "Token del método de pago" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pago creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transactionNumber: { type: "string" },
                    transactionId: { type: "string" },
                    status: { type: "string" },
                    totalInCents: { type: "integer" },
                    quantity: { type: "integer" },
                    providerTransactionId: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          "400": {
            description: "Datos inválidos o error del proveedor",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/webhooks/payment": {
      post: {
        summary: "Webhook de pago (Wompi)",
        description:
          "Recibe la notificación del proveedor cuando cambia el estado de una transacción (APPROVED, DECLINED, ERROR). En APPROVED se descuenta el stock.",
        operationId: "webhookPayment",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "object",
                    properties: {
                      transaction: {
                        type: "object",
                        properties: {
                          id: { type: "string", description: "ID de la transacción en el proveedor" },
                          status: { type: "string", enum: ["APPROVED", "DECLINED", "ERROR"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Evento procesado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    transactionId: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Faltan data.transaction.id o status",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
              },
            },
          },
          "404": {
            description: "Transacción no encontrada",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
              },
            },
          },
        },
      },
    },
  },
};

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openApiSpec);
}
