# Prueba

Monorepo: **apps/web** (React) y **apps/api** (NestJS). Arquitectura hexagonal en el backend.

## Estructura

```
prueba/
├── apps/
│   ├── api/        # Backend NestJS – domain, application, infrastructure en src/; controladores en src/controllers/
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
| api | 3001   | API NestJS (hexagonal)    |

La web hace proxy de `/api` al backend en desarrollo.

## API (Backend NestJS)

Arquitectura hexagonal: **domain** (entidades), **application** (puertos y casos de uso con ROP), **infrastructure** (Prisma, adaptador de pagos). La lógica de negocio no está en los controladores; los controladores solo delegan en casos de uso.

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
cp .env.example .env   # Completar DATABASE_URL, FRONTEND_URL, API_URL (y opcional PAYMENT_*)
pnpm exec prisma migrate deploy   # Aplicar migraciones
pnpm run db:seed                  # Productos dummy con imágenes
pnpm dev                          # Genera cliente, aplica migraciones y arranca (puerto 3001)
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Estado del servicio |
| GET | /api/products | Lista de productos (con imageUrls y stock) |
| GET | /api/config | Fee base, envío y (si hay) claves del proveedor de pagos |
| GET | /api/wompi/merchant | Tokens de aceptación (términos y datos personales) |
| POST | /api/payments | Crear pago (body: productId, quantity, amountInCents, customerEmail, customerFullName, delivery, acceptanceToken, acceptPersonalAuth?, paymentMethodToken) |
| POST | /api/webhooks/payment | Webhook de pago: actualizar transacción y stock (body: data.transaction.id, data.transaction.status) |

Documentación interactiva (Swagger): **GET /docs** (p. ej. `http://localhost:3001/docs`).

#### Integración de pagos (pagos con tarjeta)

Variables de entorno en **apps/api** (copiar desde `.env.example`):

| Variable | Uso |
|----------|-----|
| `FRONTEND_URL` | URL del frontend (p. ej. `http://localhost:3000`). Para redirigir tras el pago. |
| `API_URL` | URL pública del backend (p. ej. `http://localhost:3001`). Para links de pago y webhooks. |
| `PAYMENT_REDIRECT_URL` | URL pública del backend en local con ngrok (p. ej. `https://xxx.ngrok-free.app`). Obligatoria para redirect en desarrollo. |
| `PAYMENT_BASE_URL` | Base URL de la API del proveedor de pagos (según documentación del proveedor). |
| `PAYMENT_PUBLIC_KEY` | Clave pública del comercio (para merchants y para que el front tokenice la tarjeta vía config). |
| `PAYMENT_PRIVATE_KEY` | Clave privada (Bearer) para crear transacciones. |
| `PAYMENT_INTEGRITY_KEY` | Secreto para firmar la transacción. |

Flujo en el frontend:

1. **Productos y config**: Al cargar la app se llama a `GET /api/products` y `GET /api/config`. El config devuelve las claves del proveedor si están configuradas.
2. **Modal de pago**: Al abrir el modal se llama a `GET /api/wompi/merchant` para obtener los tokens de aceptación (términos y datos personales). El usuario debe marcar las casillas y rellenar tarjeta (VISA/Mastercard) y entrega.
3. **Tokenizar tarjeta**: Al "Continuar al resumen" el frontend tokeniza la tarjeta con el proveedor. Los datos de la tarjeta no pasan por nuestro servidor.
4. **Crear pago**: En el resumen, al hacer "Pagar" se llama a `POST /api/payments` con los tokens y datos. El backend crea la transacción en PENDING, llama al proveedor y devuelve el resultado.
5. **Webhook**: El proveedor envía el resultado a `POST /api/webhooks/payment`. Si el estado es APPROVED se actualiza la transacción y se descuenta el stock.
6. **Resultado**: Se muestra éxito o error; "Volver a productos" recarga la lista desde `GET /api/products` para ver el stock actualizado.

#### Payment Links y webhook con ngrok

Ver **docs/WOMPI_PAYMENT_LINKS_Y_WEBHOOK.md** para:

- Crear **links de pago** (`POST /payment_links`): nombre, descripción, monto, `redirect_url` al proxy.
- Usar un **proxy de redirección** (`/api/payments/wompi-redirect`) con URL fija (p. ej. vía ngrok) para que el proveedor redirija ahí y luego nuestro backend redirija al front con `id` y `status`.
- Configurar el **webhook** con **ngrok** en desarrollo y con la URL pública en producción.

### Tests

Los tests unitarios son **obligatorios** (Jest) y la cobertura debe ser **superior al 80%** en frontend y backend.

**Comandos:**

```bash
# Backend (apps/api)
cd apps/api; pnpm test             # solo ejecutar tests
cd apps/api; pnpm test:coverage    # tests + reporte de cobertura

# Frontend (apps/web)
cd apps/web; pnpm test
cd apps/web; pnpm test:coverage

# Desde la raíz del monorepo (con pnpm workspaces)
pnpm --filter api test:coverage
pnpm --filter web test:coverage
```

**Resultados de cobertura**

| App | Statements | Branches | Functions | Lines |
|-----|------------|----------|-----------|-------|
| **api** | 100% | 100% | 100% | 100% |
| **web** | 97.63% | 80.88% | 100% | 100% |

- **Backend (api):** Cobertura sobre `src/application` (ROP, use cases: get-products, create-payment, create-payment-link, update-transaction-webhook) y `src/config` (constants). Los controladores NestJS en `src/controllers/` están excluidos del reporte. 6 suites, 32 tests.
- **Frontend (web):** Cobertura sobre `src/utils` (cardValidation), `src/store` (checkout slice), `src/api` (client) y `src/pages/ResultadoPagoPage`. 4 suites, 58 tests. Umbral global ≥80%.
