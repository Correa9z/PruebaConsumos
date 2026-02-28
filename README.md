# Prueba

Monorepo: **apps/web** (React) y **apps/api** (Next.js). Arquitectura hexagonal en el backend.

## Estructura

```
prueba/
├── apps/
│   ├── api/        # Backend Next.js – domain, application, infrastructure en src/
│   └── web/        # Frontend React (Vite)
├── packages/       # (futuro: shared-types, ocr-migration)
├── docker/         # Configuración Docker
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Requisitos

- Node >= 20
- pnpm

## Comandos

```bash
pnpm install
pnpm dev          # ambas apps
pnpm dev:api      # API en 3001
pnpm dev:web      # Web en 3000
pnpm build
pnpm lint
```

## Apps

| App | Puerto | Descripción                |
|-----|--------|----------------------------|
| web | 3000   | SPA React (Vite)           |
| api | 3001   | API Next.js (hexagonal)   |

La web hace proxy de `/api` al backend en desarrollo.

## API (Backend Next.js)

Arquitectura hexagonal: **domain** (entidades), **application** (puertos y casos de uso con ROP), **infrastructure** (Prisma, adaptador de pagos). La lógica de negocio no está en las rutas; las rutas solo delegan en casos de uso.

### Modelo de datos (PostgreSQL)

```
Product
  id (cuid), name, description, priceInCents, stock, imageUrls (text[]), createdAt, updatedAt

Customer
  id (cuid), email (unique), fullName, createdAt

Delivery
  id (cuid), address, city, region?, phone, postalCode?, createdAt

Transaction
  id (cuid), transactionNumber (unique), productId (FK), customerId (FK), deliveryId (FK),
  quantity, amountInCents, baseFeeInCents, deliveryFeeInCents, totalInCents,
  status (PENDING|APPROVED|DECLINED|ERROR), providerTransactionId?, createdAt, updatedAt
```

- **imageUrls**: array de URLs (strings) que referencian las imágenes del producto (por ejemplo URLs externas o rutas a almacenamiento).
- **quantity**: unidades compradas en esa transacción; al confirmar pago se descuenta del stock del producto.

### Migraciones y seed

```bash
cd apps/api
cp .env.example .env   # Completar DATABASE_URL (y opcional PAYMENT_*)
pnpm exec prisma migrate deploy   # Aplicar migraciones
pnpm run db:seed                  # Productos dummy con imágenes
pnpm dev                          # Genera cliente, aplica migraciones y arranca (puerto 3001)
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Estado del servicio |
| GET | /api/products | Lista de productos (con imageUrls y stock) |
| GET | /api/config | Fee base y envío (baseFeeInCents, deliveryFeeInCents) |
| POST | /api/payments | Crear pago (body: productId, quantity, amountInCents, customerEmail, customerFullName, delivery, acceptanceToken, paymentMethodToken) |
| POST | /api/webhooks/payment | Webhook para actualizar transacción y stock (body: data.transaction.id, data.transaction.status) |

Documentación interactiva (Swagger): **GET /docs** (p. ej. `http://localhost:3001/docs`).

Sin variables de pago configuradas, `POST /api/payments` fallará; el resto funciona con datos en BD.

### Tests

- Tests unitarios con **Jest** (obligatorio; cobertura >80%). Los resultados se documentan en este README.
- Por ejecutar: `cd apps/api && pnpm test` / `pnpm test:coverage` cuando estén implementados.
