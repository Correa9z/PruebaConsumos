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
| GET | /api/config | Fee base, envío y (si hay) wompiPublicKey, wompiBaseUrl |
| GET | /api/wompi/merchant | Tokens de aceptación Wompi (términos y datos personales) |
| POST | /api/payments | Crear pago (body: productId, quantity, amountInCents, customerEmail, customerFullName, delivery, acceptanceToken, acceptPersonalAuth?, paymentMethodToken) |
| POST | /api/webhooks/payment | Webhook Wompi: actualizar transacción y stock (body: data.transaction.id, data.transaction.status) |

Documentación interactiva (Swagger): **GET /docs** (p. ej. `http://localhost:3001/docs`).

#### Integración Wompi (pagos con tarjeta)

Variables de entorno en **apps/api** (copiar desde `.env.example`):

| Variable | Uso |
|----------|-----|
| `PAYMENT_BASE_URL` | Base URL de la API Wompi. Producción: `https://production.wompi.co/v1`. Pruebas: `https://sandbox.wompi.co/v1`. |
| `PAYMENT_PUBLIC_KEY` | Clave pública del comercio (para GET merchants y para que el front tokenice la tarjeta vía config). |
| `PAYMENT_PRIVATE_KEY` | Clave privada (Bearer) para crear transacciones en Wompi. |
| `PAYMENT_INTEGRITY_KEY` | Secreto para firmar la transacción: `SHA256(reference + amountInCents + "COP" + key)`. |

Flujo en el frontend:

1. **Productos y config**: Al cargar la app se llama a `GET /api/products` y `GET /api/config`. El config devuelve `wompiPublicKey` y `wompiBaseUrl` si están configurados.
2. **Modal de pago**: Al abrir el modal se llama a `GET /api/wompi/merchant` para obtener los tokens de aceptación (términos y datos personales). El usuario debe marcar las casillas y rellenar tarjeta (VISA/Mastercard) y entrega.
3. **Tokenizar tarjeta**: Al "Continuar al resumen" el frontend tokeniza la tarjeta con `POST {wompiBaseUrl}/tokens/cards` (Authorization: Bearer wompiPublicKey). Los datos de la tarjeta no pasan por nuestro servidor.
4. **Crear pago**: En el resumen, al hacer "Pagar" se llama a `POST /api/payments` con `acceptanceToken`, `acceptPersonalAuth` (opcional pero requerido en Colombia), `paymentMethodToken`, producto, cantidad, fees, cliente y entrega. El backend crea la transacción en PENDING, llama a Wompi `POST /v1/transactions` y devuelve el resultado.
5. **Webhook**: Wompi envía el resultado a `POST /api/webhooks/payment`. Si el estado es APPROVED se actualiza la transacción y se descuenta el stock.
6. **Resultado**: Se muestra éxito o error; "Volver a productos" recarga la lista desde `GET /api/products` para ver el stock actualizado.

#### Payment Links y webhook con ngrok (a implementar)

Ver **docs/WOMPI_PAYMENT_LINKS_Y_WEBHOOK.md** para:

- Crear **links de pago** en Wompi (`POST /payment_links`): nombre, descripción, monto, `redirect_url` al proxy.
- Usar un **proxy de redirección** (`/api/payments/wompi-redirect`) con URL fija (p. ej. vía ngrok) para que Wompi redirija ahí y luego nuestro backend redirija al front con `id` y `status`.
- Configurar el **webhook** con **ngrok** en desarrollo (`https://xxx.ngrok-free.app/api/webhooks/payment`) y con la URL pública en producción.

### Tests

- Tests unitarios con **Jest** (obligatorio; cobertura >80%). Los resultados se documentan en este README.
- Por ejecutar: `cd apps/api && pnpm test` / `pnpm test:coverage` cuando estén implementados.
