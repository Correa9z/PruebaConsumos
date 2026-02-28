# Wompi: Payment Links y Webhook con ngrok

Referencia para el flujo de **Payment Links** y el uso de **ngrok** para que Wompi pueda enviar el webhook y redirigir tras el pago.

---

## 0. ngrok en este proyecto (pasos concretos)

En la raíz del repo hay:

- **`ngrok.yml`** – Tunel que expone el backend (puerto **3001**) para este proyecto.
- **`start-ngrok.bat`** – Script para arrancar ngrok en Windows.

**Pasos:**

1. **Authtoken:** En [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken) copia tu authtoken. En `ngrok.yml` descomenta la línea `authtoken:` y pega el valor (o exporta `NGROK_AUTHTOKEN` al ejecutar). Si pegas el token en el archivo, conviene añadir `ngrok.yml` al `.gitignore` para no subirlo.

2. **Dominio fijo (opcional):** Si tienes un dominio reservado en ngrok (p. ej. `innate-husbandly-allie.ngrok-free.dev`), en `ngrok.yml` descomenta la línea `domain:` y pon tu dominio. Si no, ngrok te asignará una URL distinta cada vez que lo inicies.

3. **Arrancar el backend:** En `apps/api` ejecuta `npm run dev` (puerto 3001).

4. **Arrancar ngrok:** En la raíz del repo ejecuta `start-ngrok.bat`. En la consola verás la URL pública (p. ej. `https://xxxx.ngrok-free.app` o tu dominio).

5. **Variables de entorno del API:** En `apps/api/.env` define:
   - `PAYMENT_REDIRECT_URL=https://TU-URL-NGROK` (sin barra final, sin `/api/...`).  
     Ejemplo: `PAYMENT_REDIRECT_URL=https://innate-husbandly-allie.ngrok-free.dev`  
     Así el `redirect_url` que enviamos a Wompi será `https://TU-URL-NGROK/api/payments/wompi-redirect`.

6. **Configurar Wompi:** En el dashboard de Wompi (comercios / configuración de eventos) registra la URL del webhook:
   - **URL del webhook:** `https://TU-URL-NGROK/api/webhooks/payment` o `https://TU-URL-NGROK/api/webhooks/wompi`  
   Con eso el backend recibirá las notificaciones y actualizará la transacción y el stock.

**Resumen de URLs (reemplaza `TU-URL-NGROK` por tu URL de ngrok):**

| Uso | URL |
|-----|-----|
| Redirect tras el pago (la construye el backend) | `https://TU-URL-NGROK/api/payments/wompi-redirect` |
| Webhook (configurar en Wompi) | `https://TU-URL-NGROK/api/webhooks/payment` o `.../api/webhooks/wompi` |

**Nota:** Este proyecto usa el puerto **3001**. Si tu `ngrok.yml` de otro proyecto (p. ej. ExcePay) apunta al 7206, son túneles distintos: para WompiTest usa el `ngrok.yml` y el `start-ngrok.bat` de este repo. Si quieres usar el mismo dominio (p. ej. `innate-husbandly-allie.ngrok-free.dev`) aquí, ponlo en `domain:` en este `ngrok.yml` y asegúrate de que el túnel apunte a **3001** cuando trabajes en WompiTest.

---

## 1. Payment Links

Flujo alternativo: en lugar de tokenizar tarjeta en nuestro checkout, el backend crea un **link de pago** en Wompi y devuelve la URL; el usuario abre ese link, paga en el checkout de Wompi y es redirigido de vuelta a nuestra app.

### Endpoint Wompi

- **Crear link:** `POST {PAYMENT_BASE_URL}/payment_links` (o el path que indique la doc de Wompi para tu país; p. ej. `/v1/payment_links`).
- **Autenticación:** `Authorization: Bearer {PAYMENT_PRIVATE_KEY}`.
- **Headers recomendados:** `Accept: application/json`, `User-Agent` (p. ej. `ExcePayCore/1.0`) para evitar bloqueos de WAF.

### Payload a enviar

```json
{
  "name": "Nombre del pago / producto",
  "description": "Descripción",
  "single_use": true,
  "collect_shipping": false,
  "currency": "COP",
  "amount_in_cents": 25000,
  "expires_at": "2025-03-10T23:59:59Z",
  "redirect_url": "https://TU-NGROK-URL/api/payments/wompi-redirect"
}
```

- **redirect_url:** Debe ser una URL **pública y estable**. Con ngrok/local tunnel se usa un **proxy fijo** en nuestro backend (p. ej. `/api/payments/wompi-redirect`) y esa ruta es la que se configura en Wompi. No agregar query params al `redirect_url`; Wompi añade los suyos (`?id=...`, `status=...`, etc.).
- **Monto:** En centavos (`amount * 100`).
- **expires_at:** ISO 8601 en UTC. Opcional; si no se envía, Wompi puede usar un default (p. ej. 7 días).

### Respuesta Wompi

- `data.id` → ID del link en Wompi.
- `data.permalink` → URL del checkout (p. ej. `https://checkout.wompi.co/l/test_xxxx`).
- Si no viene `permalink`, construir: `https://checkout.wompi.co/l/{data.id}`.

El backend devuelve al front la URL del link para que el usuario sea redirigido (o se abra en nueva pestaña) a esa URL.

---

## 2. Proxy de redirección (`/api/payments/wompi-redirect`)

Cuando el usuario termina de pagar en el checkout de Wompi, Wompi redirige al `redirect_url` configurado (nuestro proxy), típicamente con query params como `id` (transacción) y/o `status`.

- **Objetivo del proxy:** Tener una URL fija que no cambie aunque cambie la URL de ngrok o del frontend, y evitar problemas con WAF de Wompi (sin query params raros en la URL que enviamos al crear el link).
- **Comportamiento sugerido:**
  - Recibir `GET /api/payments/wompi-redirect?id=...&status=...` (o los nombres que envíe Wompi).
  - Opción A: Redirigir (302) al frontend con esos mismos params, p. ej. `https://tu-app.com/resultado-pago?id=...&status=...`.
  - Opción B: Devolver HTML con meta refresh o JS que redirija al front.

Ejemplo de ruta (Next.js) que redirige al front:

```ts
// app/api/payments/wompi-redirect/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = new URL("/", frontendUrl);
  if (id) redirectTo.searchParams.set("payment_id", id);
  if (status) redirectTo.searchParams.set("payment_status", status);
  return Response.redirect(redirectTo.toString(), 302);
}
```

Así el usuario termina en la app con los parámetros necesarios para mostrar el resultado del pago.

---

## 3. Webhook con ngrok hasta producción

El webhook actual es `POST /api/webhooks/payment` y actualiza la transacción y el stock cuando Wompi envía el evento (p. ej. `APPROVED`). También existe **`POST /api/webhooks/wompi`** con la misma lógica, por si en el dashboard de Wompi tienes configurada esa URL (`https://tu-ngrok/api/webhooks/wompi`).

- **Cuándo se guarda `provider_transaction_id`:** Solo cuando el webhook se ejecuta y encuentra la transacción: bien porque ya tenía ese id, bien porque Wompi envía `reference` (nuestro `transactionNumber`) en el evento y la buscamos por ese número. Si el webhook no llega, falla antes de actualizar, o Wompi no envía `reference`, la transacción puede quedar sin `provider_transaction_id`. Al crear el payment link enviamos `reference: transactionNumber` para que Wompi lo devuelva en el evento.

- **Estado real en la página de resultado:** La página `/resultado-pago` recibe `id` y `status` por la URL del redirect. Para reflejar aprobaciones manuales o estados actualizados por webhook, la página llama a `GET /api/transactions/status?providerId=xxx` (el `id` de la URL es el id de la transacción en Wompi). Si en nuestro backend esa transacción tiene ya el estado actualizado, se muestra ese estado; si no, se usa el `status` de la URL.

- **En local / pruebas:** La API no tiene URL pública, así que Wompi no puede llamarla. Para probar el webhook:
  1. Exponer el backend con **ngrok**: `ngrok http 3001`.
  2. Copiar la URL HTTPS que te da ngrok (p. ej. `https://abc123.ngrok-free.app`).
  3. En el dashboard de Wompi (o en la config del comercio), configurar la URL del evento:
     - `https://abc123.ngrok-free.app/api/webhooks/payment`
  4. Cada vez que reinicies ngrok (plan gratuito) la URL puede cambiar; tendrás que actualizar esa URL en Wompi.

- **Variables de entorno útiles:**
  - `NEXT_PUBLIC_APP_URL`: URL del frontend (para el proxy de redirección y redirecciones post-pago).
  - Opcional: `WOMPI_WEBHOOK_URL` o similar para construir la URL que se registra en Wompi (en dev sería la URL de ngrok + `/api/webhooks/payment`).

- **Producción:** Cuando subas el backend a un dominio público (p. ej. en AWS), configurar en Wompi la URL definitiva del webhook, p. ej. `https://api.tudominio.com/api/webhooks/payment`.

---

## 4. Resumen de qué mandar a Wompi

| Caso | Qué mandar |
|------|------------|
| **Transacción con tarjeta (flujo actual)** | `POST /v1/transactions` con `acceptance_token`, `accept_personal_auth`, `amount_in_cents`, `customer_email`, `payment_method`, `reference`, `signature`. |
| **Payment Link (a implementar)** | `POST /v1/payment_links` (o el path correcto para tu país) con `name`, `description`, `single_use`, `collect_shipping`, `currency`, `amount_in_cents`, `expires_at`, `redirect_url` (URL del proxy, p. ej. `https://tu-ngrok.ngrok-free.app/api/payments/wompi-redirect`). |
| **Webhook** | En Wompi configurar la URL del webhook: en dev `https://tu-ngrok.ngrok-free.app/api/webhooks/payment`, en producción `https://api.tudominio.com/api/webhooks/payment`. |

---

## 5. Referencia del código C# (ExcePayCore)

- Se fuerza un `redirect_url` fijo al proxy: `https://innate-husbandly-allie.ngrok-free.dev/api/payments/wompi-redirect`.
- No se envían query params en el `redirect_url` para evitar bloqueos del WAF de Wompi.
- Se usa `User-Agent` para evitar bloqueos.
- La respuesta de Wompi se parsea para obtener `data.id` y `data.permalink`; si no hay permalink, se construye `https://checkout.wompi.co/l/{id}`.

Al implementar en este proyecto (Next.js/TypeScript), seguir la misma lógica: payload limpio, redirect_url estable al proxy, y en producción sustituir la URL de ngrok por la URL pública del API.
