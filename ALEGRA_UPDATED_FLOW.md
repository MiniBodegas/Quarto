# 🔄 Flujo Actualizado: Facturación DESPUÉS del Pago

## ⚠️ CAMBIO IMPORTANTE

La integración con Alegra fue actualizada para generar facturas **DESPUÉS de confirmar el pago**, no antes.

---

## 📊 Flujo Anterior (INCORRECTO)

```
Usuario completa reserva
    ↓
Se crea booking en Supabase
    ↓
✅ FACTURA CREADA EN ALEGRA  ❌ (antes de pagar)
    ↓
Usuario ve pantalla de pago
    ↓
Usuario paga con Wompi
    ↓
Webhook actualiza payment_status
```

**Problema**: Se generaba factura incluso si el usuario nunca pagaba.

---

## ✅ Flujo Actual (CORRECTO)

```
Usuario completa reserva
    ↓
Se crea booking en Supabase
    ↓
Usuario ve pantalla de pago
    ↓
Usuario paga con Wompi
    ↓
Webhook recibe notificación (status = APPROVED)
    ↓
✅ FACTURA CREADA EN ALEGRA AUTOMÁTICAMENTE
    ↓
Factura vinculada al booking
```

**Ventaja**: Solo se factura cuando hay pago confirmado.

---

## 🔧 Cambios Técnicos Realizados

### 1. Backend (`Backend/server.js`)

#### Nueva función auxiliar:
```javascript
async function createAlegraInvoice(bookingId, clientData, invoiceData) {
  // Busca o crea cliente en Alegra
  // Genera items con IVA
  // Crea factura
  // Actualiza booking con referencias
  return { success: true, invoice: {...} }
}
```

#### Webhook modificado:
```javascript
app.post("/api/wompi/webhook", async (req, res) => {
  // ... actualización de booking y payment ...
  
  // 🆕 Si el pago fue aprobado
  if (status === "APPROVED") {
    // Obtener datos completos del booking
    const { data: fullBooking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    
    // Verificar que no exista factura ya
    if (!fullBooking.alegra_invoice_id) {
      // Crear factura en Alegra
      const result = await createAlegraInvoice(bookingId, clientData, invoiceData);
      
      if (result.success) {
        console.log("✅ Factura creada:", result.invoice.number);
      }
    }
  }
});
```

### 2. Frontend (`src/Components/calculator/BookingScreen.jsx`)

#### Removido:
```javascript
// ❌ Ya NO se crea factura aquí
// createInvoiceOnBooking(bookingDataForInvoice)
```

#### Reemplazado por:
```javascript
console.log("ℹ️ La factura se generará automáticamente después del pago con Wompi");
```

---

## 📋 Qué Pasa Ahora

### Escenario 1: Pago Exitoso

1. Usuario completa reserva → `booking_id` creado
2. Usuario va a Wompi y paga
3. Wompi envía webhook con `status: "APPROVED"`
4. Backend actualiza: `payment_status = "APPROVED"`
5. **Backend crea factura en Alegra automáticamente**
6. Factura queda vinculada al booking:
   ```sql
   UPDATE bookings SET
     alegra_invoice_id = '67890',
     alegra_invoice_number = 'FV-0001',
     alegra_invoice_pdf = 'https://...'
   WHERE id = 'booking-123';
   ```

### Escenario 2: Pago Pendiente

1. Usuario completa reserva → `booking_id` creado
2. Usuario cierra la ventana SIN pagar
3. No hay webhook de Wompi
4. **No se crea factura en Alegra** ✅
5. El booking queda con `payment_status = "PENDING"`

### Escenario 3: Pago Rechazado

1. Usuario completa reserva → `booking_id` creado
2. Usuario intenta pagar pero es rechazado
3. Wompi envía webhook con `status: "DECLINED"`
4. Backend actualiza: `payment_status = "DECLINED"`
5. **No se crea factura** ✅

---

## 🧪 Testing

### Probar flujo completo:

```bash
# 1. Crear reserva en la app (frontend)
# 2. Ir a pantalla de pago
# 3. Completar pago con tarjeta de prueba Wompi
# 4. Verificar logs del backend:

[WOMPI WEBHOOK] Transaction Update:
  - Status: APPROVED
  - Booking: abc123

[WOMPI WEBHOOK] 💰 Pago aprobado, generando factura en Alegra...
[ALEGRA] Cliente existente: 12345
[ALEGRA] Creando factura: {...}
[ALEGRA] ✅ Factura creada: 67890
[WOMPI WEBHOOK] ✅ Factura creada en Alegra: FV-0001

# 5. Verificar en Supabase:
SELECT 
  id,
  payment_status,
  alegra_invoice_id,
  alegra_invoice_number,
  alegra_invoice_pdf
FROM bookings
WHERE id = 'abc123';

# Resultado esperado:
# payment_status: APPROVED
# alegra_invoice_id: 67890
# alegra_invoice_number: FV-0001
# alegra_invoice_pdf: https://app.alegra.com/...

# 6. Verificar en Alegra:
# - Ir a Ventas → Facturas
# - Buscar factura FV-0001
# - Verificar estado: Abierta (open)
```

---

## ⚡ Ventajas del Nuevo Flujo

### 1. **Control de inventario**
- Solo se factura lo que se pagó
- No hay facturas "fantasma" sin pago

### 2. **Cumplimiento contable**
- Factura = pago confirmado
- Mejor trazabilidad financiera

### 3. **Experiencia de usuario**
- Usuario no recibe factura si no paga
- Menos confusión

### 4. **Integración Wompi-Alegra**
- Todo automatizado en el webhook
- Sin intervención manual

### 5. **Idempotencia**
- Si Wompi reenvía el webhook, no se duplica la factura
- Se verifica `if (!fullBooking.alegra_invoice_id)`

---

## 🔍 Verificación de Idempotencia

El sistema previene facturas duplicadas:

```javascript
// En el webhook de Wompi
if (fullBooking.alegra_invoice_id) {
  console.log("⚠️ Ya existe factura para este booking:", fullBooking.alegra_invoice_id);
  // NO crea nueva factura
} else {
  // Crea factura solo si no existe
  const result = await createAlegraInvoice(...);
}
```

**Escenarios cubiertos:**
- ✅ Wompi reenvía el mismo webhook → Se detecta factura existente
- ✅ Usuario paga múltiples veces (error) → Solo 1 factura
- ✅ Webhook llega tarde → No importa, se crea cuando llegue

---

## 📝 Logs de Depuración

### Pago exitoso con factura:
```
[WOMPI WEBHOOK] Evento recibido: transaction.updated
[WOMPI WEBHOOK] Transaction Update:
  - ID: WOMPI-12345
  - Reference: QUARTO_abc123_1703876543
  - Status: APPROVED
  - Amount: 495040 COP

[WOMPI WEBHOOK] OK booking: abc123 → APPROVED
[WOMPI WEBHOOK] 💰 Pago aprobado, generando factura en Alegra...

[ALEGRA] Cliente existente: 12345
[ALEGRA] Creando factura: {
  "date": "2025-12-29",
  "dueDate": "2026-01-28",
  "client": { "id": 12345 },
  "items": [...]
}

[ALEGRA] ✅ Factura creada: 67890
[WOMPI WEBHOOK] ✅ Factura creada en Alegra: FV-0001
```

### Intento de factura duplicada:
```
[WOMPI WEBHOOK] 💰 Pago aprobado, generando factura en Alegra...
[WOMPI WEBHOOK] ⚠️ Ya existe factura para este booking: 67890
```

### Pago rechazado (sin factura):
```
[WOMPI WEBHOOK] Transaction Update:
  - Status: DECLINED

[WOMPI WEBHOOK] OK booking: abc123 → DECLINED
(No se crea factura)
```

---

## 🔐 Seguridad

### Validaciones implementadas:

1. **Verificación de estado**: Solo crea factura si `status === "APPROVED"`
2. **Idempotencia**: Verifica `alegra_invoice_id` antes de crear
3. **Manejo de errores**: Si Alegra falla, no afecta el webhook de Wompi
4. **Try-catch aislado**: Error en facturación no rompe el flujo de pago

```javascript
try {
  // Crear factura
} catch (alegraError) {
  console.error("Error en facturación:", alegraError);
  // Webhook continúa exitosamente
  // No se pierde el registro del pago
}
```

---

## 🎯 Casos de Uso Reales

### Usuario A: Paga inmediatamente
```
12:00:00 - Completa reserva (booking-123)
12:00:30 - Paga con Wompi
12:00:31 - Webhook recibido (APPROVED)
12:00:32 - ✅ Factura FV-0001 creada en Alegra
12:00:33 - Email con factura enviado (si está configurado)
```

### Usuario B: Abandona el carrito
```
12:00:00 - Completa reserva (booking-456)
12:00:30 - Cierra la ventana sin pagar
...
(No se crea factura nunca)
```

### Usuario C: Pago rechazado, reintenta
```
12:00:00 - Completa reserva (booking-789)
12:00:30 - Pago rechazado (tarjeta sin fondos)
12:00:31 - Webhook: status = DECLINED (sin factura)
12:05:00 - Reintenta con otra tarjeta
12:05:01 - Pago aprobado
12:05:02 - Webhook: status = APPROVED
12:05:03 - ✅ Factura FV-0002 creada
```

---

## 📚 Archivos Modificados

- ✅ `Backend/server.js` - Función auxiliar + lógica en webhook
- ✅ `src/Components/calculator/BookingScreen.jsx` - Removida creación de factura
- ✅ Este documento de actualización

---

## 🚀 Despliegue

**No requiere cambios adicionales de configuración**

Las variables de entorno de Alegra ya están en `.env`:
```env
ALEGRA_USERNAME=tu_usuario
ALEGRA_PASSWORD=tu_password
ALEGRA_PRODUCT_STORAGE_ID=1
ALEGRA_PRODUCT_TRANSPORT_ID=2
ALEGRA_TAX_IVA_ID=1
```

Solo reiniciar el backend:
```bash
cd Backend
npm run dev
```

---

## ✅ Checklist de Verificación

- [x] Webhook de Wompi actualizado con lógica de facturación
- [x] Función `createAlegraInvoice()` creada
- [x] Endpoint POST usa la nueva función auxiliar
- [x] BookingScreen NO crea factura al guardar
- [x] Idempotencia implementada
- [x] Manejo de errores robusto
- [x] Logs detallados para debugging
- [x] Documentación actualizada

---

**El sistema está listo para producción** 🎉

Ahora las facturas solo se generan cuando hay pagos confirmados, lo cual es el comportamiento contable correcto.
