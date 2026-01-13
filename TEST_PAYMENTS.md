# 🧪 Guía de Testing: Flujo de Pagos con Wompi

## Problema Identificado
Los campos `wompi_transaction_id` y `status` no se estaban guardando/actualizando correctamente en la tabla `payments`.

## Cambios Realizados

### 1. BookingScreen.jsx
- ✅ Ahora guarda `transport_price` en el booking
- ✅ Crea registro inicial en tabla `payments` con status `PENDING`
- ✅ Incluye toda la información necesaria: `booking_id`, `wompi_reference`, `amount_in_cents`, `currency`

### 2. server.js (Webhook)
- ✅ Busca pago existente por `booking_id` (no solo por `wompi_transaction_id`)
- ✅ Actualiza el registro existente con los datos de Wompi
- ✅ Guarda correctamente `wompi_transaction_id` y `status`
- ✅ Logs detallados para debugging

## Cómo Probar el Flujo Completo

### Paso 1: Verificar la tabla payments
```sql
-- Estructura correcta de la tabla
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NULL,
  wompi_transaction_id text NULL,
  wompi_reference text NULL,
  status text NULL,
  amount_in_cents integer NULL,
  currency text NULL,
  payment_method text NULL,
  wompi_event jsonb NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_wompi_transaction_id_key UNIQUE (wompi_transaction_id),
  CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) 
    REFERENCES bookings (id) ON DELETE CASCADE
);
```

### Paso 2: Crear una reserva de prueba
1. Ve a la aplicación y crea una nueva reserva
2. Completa todos los datos del formulario
3. Anota el `booking_id` que aparece en la consola del navegador

### Paso 3: Verificar el registro inicial en payments
```bash
# Endpoint de debug
curl http://localhost:3000/api/debug/booking/<BOOKING_ID>
```

**Deberías ver:**
```json
{
  "booking": {
    "id": "...",
    "payment_status": "PENDING",
    "wompi_reference": "QUARTO_...",
    "wompi_transaction_id": null,  // ← Aún null, es correcto
    "amount_total": 150000,
    "amount_monthly": 100000,
    "transport_price": 50000
  },
  "payments": [
    {
      "id": "...",
      "booking_id": "...",
      "wompi_reference": "QUARTO_...",
      "wompi_transaction_id": null,  // ← Aún null, es correcto
      "status": "PENDING",  // ← Debe ser PENDING
      "amount_in_cents": 15000000,
      "currency": "COP",
      "payment_method": "wompi"
    }
  ],
  "summary": {
    "booking_has_payments": true,
    "booking_payment_status": "PENDING",
    "latest_payment_status": "PENDING"
  }
}
```

### Paso 4: Simular webhook de Wompi (Pago Aprobado)
```bash
cd Backend
node scripts/test_wompi_webhook.js <BOOKING_ID>
```

### Paso 5: Verificar actualización del pago
```bash
curl http://localhost:3000/api/debug/booking/<BOOKING_ID>
```

**Deberías ver:**
```json
{
  "booking": {
    "id": "...",
    "payment_status": "APPROVED",  // ← Ahora APPROVED
    "wompi_transaction_id": "evt_...",  // ← Ahora tiene ID
    "wompi_reference": "QUARTO_..."
  },
  "payments": [
    {
      "id": "...",
      "wompi_transaction_id": "evt_...",  // ← Ahora tiene ID
      "status": "APPROVED",  // ← Ahora APPROVED
      "amount_in_cents": 15000000
    }
  ],
  "summary": {
    "booking_has_payments": true,
    "booking_payment_status": "APPROVED",
    "latest_payment_status": "APPROVED",
    "wompi_transaction_id_in_booking": "evt_...",
    "wompi_transaction_id_in_payments": "evt_..."
  }
}
```

### Paso 6: Ver todos los pagos
```bash
curl http://localhost:3000/api/debug/payments
```

## Logs del Webhook

Cuando el webhook recibe una notificación de Wompi, verás estos logs en la consola del backend:

```
═══════════════════════════════════════════════════════════
🔔 [WOMPI WEBHOOK] LLAMADA RECIBIDA 2026-01-13T...
═══════════════════════════════════════════════════════════
[WOMPI WEBHOOK] ⭐ INICIANDO PROCESAMIENTO
[WOMPI] 📊 Transaction Update Recibida:
  - ID: evt_...
  - Reference: QUARTO_...
  - Status: APPROVED
  - Amount: 15000000 COP
[WOMPI] 🔍 Buscando booking con wompi_reference: QUARTO_...
[WOMPI] ✅ Booking encontrado: ... (Juan Perez)
[WOMPI] 💾 Actualizando booking ... - Nuevo status: APPROVED
[WOMPI] ✅ Booking actualizado correctamente
[WOMPI] 💾 Registrando pago en tabla 'payments'...
[WOMPI] 📊 Datos del pago: { booking_id: ..., wompi_transaction_id: evt_..., status: APPROVED, ... }
[WOMPI] 🔍 Pago existente encontrado: { id: ..., transaction_id_anterior: null, status_anterior: PENDING }
[WOMPI] 🔄 Actualizando pago existente con ID: ...
[WOMPI] ✅ Pago actualizado exitosamente
[WOMPI] ✅ Nuevo status: APPROVED
[WOMPI] ✅ Transaction ID guardado: evt_...
[WOMPI] ✅ Pago registrado en tabla 'payments' correctamente
[WOMPI WEBHOOK] ✅✅✅ PROCESAMIENTO COMPLETADO EXITOSAMENTE
```

## Qué buscar si algo falla

### Error: No se encuentra el pago existente
```
[WOMPI] ℹ️ No se encontró pago existente, se creará uno nuevo
```
**Causa:** El booking no tiene un registro en `payments` aún.
**Solución:** Verificar que BookingScreen esté creando el registro inicial.

### Error: wompi_transaction_id ya existe (duplicate key)
```
[WOMPI] ❌ Error insertando pago: { code: '23505', constraint: 'payments_wompi_transaction_id_key' }
```
**Causa:** Ya existe un pago con ese `wompi_transaction_id`.
**Solución:** El webhook ya procesó este pago antes (esto es normal, Wompi puede reenviar).

### Error: No se actualiza el status
**Verificar:**
1. Que el webhook se esté ejecutando correctamente
2. Que el `booking_id` sea correcto en el webhook
3. Que el pago existente se encuentre correctamente

## Comandos Útiles

### Ver últimos 10 bookings
```bash
curl http://localhost:3000/api/debug/bookings/recent/10
```

### Ver últimos 20 pagos
```bash
curl http://localhost:3000/api/debug/payments
```

### Consultar booking específico en Supabase
```sql
SELECT 
  b.id,
  b.name,
  b.email,
  b.payment_status,
  b.wompi_reference,
  b.wompi_transaction_id,
  b.amount_total,
  b.amount_monthly,
  b.transport_price,
  p.id as payment_id,
  p.status as payment_status,
  p.wompi_transaction_id as payment_tx_id,
  p.amount_in_cents
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.id = '<BOOKING_ID>';
```

## Flujo Esperado

```
1. Usuario completa formulario
   ↓
2. BookingScreen crea/actualiza booking
   - payment_status: PENDING
   - wompi_reference: QUARTO_...
   - wompi_transaction_id: NULL
   - amount_total: 150000
   - amount_monthly: 100000
   - transport_price: 50000
   ↓
3. BookingScreen crea registro en payments
   - booking_id: <id>
   - wompi_reference: QUARTO_...
   - wompi_transaction_id: NULL
   - status: PENDING
   - amount_in_cents: 15000000
   ↓
4. Usuario paga con Wompi
   ↓
5. Wompi envía webhook
   ↓
6. Webhook actualiza booking
   - payment_status: APPROVED
   - wompi_transaction_id: evt_...
   - paid_at: <timestamp>
   ↓
7. Webhook actualiza payment existente
   - wompi_transaction_id: evt_...
   - status: APPROVED
   - wompi_event: <objeto completo>
   ↓
8. UserScreen carga datos
   - Ve facturas en userInvoices (desde payments)
   - Estado correcto: APPROVED/PAID
```

## Solución Rápida si persiste el problema

Si después de aplicar todos los cambios el problema persiste:

1. **Verificar que el backend esté usando la versión actualizada:**
   ```bash
   cd Backend
   # Reiniciar servidor
   npm start
   ```

2. **Limpiar localStorage del navegador:**
   ```javascript
   // En consola del navegador
   localStorage.clear();
   ```

3. **Crear una nueva reserva desde cero:**
   - Nueva sesión
   - Nuevo booking
   - Nuevo pago

4. **Verificar logs del backend en tiempo real:**
   - Buscar `[WOMPI WEBHOOK]`
   - Buscar `[Booking]`
   - Buscar errores con `❌`
