# 🔍 Guía de Debugging - Wompi Webhook

## Problema Identificado
El webhook de Wompi puede no estar siendo llamado por varias razones:

1. **Wompi no conoce la URL del webhook** - No está configurada en tu cuenta de Wompi
2. **Webhook no es accesible públicamente** - Si estás en desarrollo local (localhost), Wompi no puede llamarlo
3. **Status del pago no es "APPROVED"** - Wompi podría estar enviando otro estado

## Pasos de Debugging

### 1️⃣ Verificar URL del Webhook en Wompi
Accede a tu cuenta de Wompi y verifica:
- **Dashboard → Configuración → Webhooks**
- La URL debe ser: `https://tu-dominio.com/api/wompi/webhook`
- El evento debe estar activado: "Actualización de transacción"

### 2️⃣ Verificar Estado de un Booking
Después de intentar pagar, ejecuta en tu navegador o curl:

```bash
# Ver estado detallado de un booking específico
curl https://tu-backend.com/api/debug/booking/[BOOKING_ID]

# Respuesta esperada:
{
  "booking": {
    "id": "abc-123",
    "wompi_reference": "QUARTO_abc-123_1234567890",
    "wompi_transaction_id": "evt_xxx",
    "payment_status": "APPROVED",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "payments": [{
    "id": "pay-123",
    "status": "APPROVED",
    "amount_in_cents": 500000
  }],
  "status": {
    "hasBooking": true,
    "hasWompiReference": true,
    "hasTransactionId": true,
    "hasPaymentRecord": true,
    "paymentStatus": "APPROVED"
  }
}
```

### 3️⃣ Ver Últimos Bookings
```bash
curl https://tu-backend.com/api/debug/bookings/recent/10
```

### 4️⃣ Verificar Logs del Backend
En la terminal donde corre el backend, busca mensajes con `[WOMPI WEBHOOK]` o `[WOMPI]`:

**Si el webhook fue llamado, verás:**
```
═══════════════════════════════════════════════════════════
🔔 [WOMPI WEBHOOK] LLAMADA RECIBIDA 2026-01-11T10:30:45.123Z
═══════════════════════════════════════════════════════════
[WOMPI] 📊 Transaction Update Recibida:
  - ID: evt_xxxxxxxxx
  - Reference: QUARTO_abc-123_1234567890
  - Status: APPROVED
  - Amount: 500000 COP
[WOMPI] ✅ Booking encontrado: abc-123 (Juan Pérez)
[WOMPI] ✅ Booking actualizado correctamente
[WOMPI] ✅ Pago registrado en tabla 'payments' correctamente
```

**Si el webhook NO fue llamado, verás:**
- Nada en los logs relacionado a `[WOMPI]`
- El `payment_status` seguirá siendo `PENDING`
- No habrá entrada en la tabla `payments`

### 5️⃣ Si Wompi NO está llamando el Webhook

**Causas más comunes:**

A) **URL no está correctamente configurada en Wompi**
   - Solución: Actualiza la URL en tu dashboard de Wompi

B) **Estás en desarrollo local (localhost:3000)**
   - Wompi no puede acceder a localhost
   - Solución: Usa ngrok o despliega en staging

C) **El servidor no está corriendo**
   - Solución: Verifica que `npm run dev` esté ejecutándose

D) **Hay un error en la firma de Wompi**
   - Solución: Verifica que WOMPI_PRIVATE_KEY esté correctamente configurado en .env

### 6️⃣ Probar el Webhook Localmente
Si quieres simular un pago de Wompi:

```bash
# Obtén un BOOKING_ID válido (usa /api/debug/bookings/recent/1)

# Luego ejecuta el script de prueba:
cd Backend/scripts
node test_wompi_webhook.js [BOOKING_ID]
```

## Checklist de Verificación

- [ ] URL del webhook está configurada en Wompi dashboard
- [ ] Backend está ejecutándose (puerto 3000)
- [ ] Booking fue creado correctamente
- [ ] wompi_reference está guardado en el booking
- [ ] La URL del webhook es accesible públicamente (no localhost)
- [ ] Tabla `payments` existe en Supabase
- [ ] El usuario completó el pago en Wompi

## Status Posibles de Wompi

- `APPROVED` - ✅ Pago aprobado, webhook debe actualizar el booking
- `PENDING` - ⏳ Esperando confirmación de banco
- `DECLINED` - ❌ Pago rechazado
- `VOIDED` - 🔄 Pago anulado

Solo `APPROVED` cambiará el `payment_status` a "APPROVED".

## URL de Endpoints de Debug

```
GET /api/debug/booking/:bookingId
GET /api/debug/bookings/recent/:limit
```

Reemplaza `:bookingId` con el ID de tu booking y `:limit` con la cantidad de bookings a listar.
