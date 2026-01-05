# ✅ Integración Alegra - Resumen de Implementación

## 📦 Archivos Creados

### Backend
- ✅ `Backend/server.js` - Endpoints `/api/alegra/create-invoice` y `/api/alegra/register-payment`
- ✅ `Backend/.env.example` - Plantilla de variables de entorno

### Frontend
- ✅ `src/services/alegraService.js` - Servicio de integración con Alegra API
- ✅ `src/hooks/useAlegra.js` - Hook React para gestión de facturas
- ✅ `src/services/alegraTest.js` - Scripts de prueba
- ✅ `src/Components/calculator/BookingScreen.jsx` - Integración en flujo de reserva

### Documentación
- ✅ `ALEGRA_INTEGRATION.md` - Guía completa de configuración y uso

---

## 🚀 Pasos para Activar

### 1. Configurar Backend

#### a) Instalar dependencias (si es necesario)
```bash
cd Backend
npm install dotenv cors express @supabase/supabase-js
```

#### b) Configurar variables de entorno
Copia `.env.example` a `.env` y completa:

```env
# Alegra
ALEGRA_API_URL=https://api.alegra.com/api/v1
ALEGRA_USERNAME=tu_usuario_alegra
ALEGRA_PASSWORD=tu_password_alegra
ALEGRA_PRODUCT_STORAGE_ID=1
ALEGRA_PRODUCT_TRANSPORT_ID=2
ALEGRA_TAX_IVA_ID=1
```

#### c) Reiniciar servidor
```bash
npm run dev
# o
node server.js
```

### 2. Configurar Alegra

#### a) Crear productos en Alegra

**Producto 1: Almacenamiento**
- Nombre: "Almacenamiento Mensual"
- Referencia: `STORAGE-MONTHLY`
- Tipo: Servicio
- Impuesto: IVA 19%

**Producto 2: Transporte**
- Nombre: "Servicio de Transporte"
- Referencia: `TRANSPORT`
- Tipo: Servicio
- Impuesto: IVA 19%

#### b) Obtener IDs
Anota los IDs de:
- Producto Almacenamiento → `ALEGRA_PRODUCT_STORAGE_ID`
- Producto Transporte → `ALEGRA_PRODUCT_TRANSPORT_ID`
- Impuesto IVA → `ALEGRA_TAX_IVA_ID`

Actualiza el `.env` con estos valores.

### 3. Actualizar Base de Datos

Ejecuta en Supabase SQL Editor:

```sql
-- Agregar columnas para Alegra en la tabla bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS alegra_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS alegra_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS alegra_invoice_pdf TEXT;

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bookings_alegra_invoice 
ON bookings(alegra_invoice_id);
```

### 4. Probar Integración

#### Opción A: Test desde consola del navegador

```javascript
// En la consola del navegador (F12)
import { testAlegraIntegration } from './src/services/alegraTest';
testAlegraIntegration();
```

#### Opción B: Test con curl

```bash
curl -X POST http://localhost:3000/api/alegra/create-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "clientData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "3001234567",
      "document_type": "CC",
      "document_number": "12345678",
      "booking_type": "person"
    },
    "invoiceData": {
      "amount_monthly": 80900,
      "transport_price": 100000,
      "total_volume": 1,
      "total_items": 10,
      "logistics_method": "Recogida"
    }
  }'
```

#### Respuesta esperada:
```json
{
  "success": true,
  "invoice": {
    "id": 67890,
    "number": "FV-0001",
    "pdfUrl": "https://app.alegra.com/...",
    "status": "open",
    "total": 215271,
    "balance": 215271
  }
}
```

---

## 🔄 Flujo Completo

### Usuario completa reserva

1. Usuario llena formulario en `BookingScreen`
2. Click en "Confirmar Reserva"
3. Se crea booking en Supabase
4. **SE CREA FACTURA EN ALEGRA AUTOMÁTICAMENTE** ✨
5. Se guarda referencia en `bookings.alegra_invoice_id`
6. Usuario va a pantalla de pago

### Usuario paga con Wompi

7. Usuario confirma pago con Wompi
8. Wompi envía webhook a `/api/wompi/webhook`
9. Backend actualiza `payment_status` a `APPROVED`
10. **SE REGISTRA PAGO EN ALEGRA AUTOMÁTICAMENTE** ✨
11. Factura queda marcada como pagada en ambos sistemas

---

## 📊 Verificación

### En Alegra:

1. Ve a **Ventas → Facturas de venta**
2. Deberías ver la factura creada con:
   - Cliente correcto
   - 2 items (Almacenamiento + Transporte)
   - IVA 19% aplicado
   - Total correcto
   - PDF generado

### En Supabase:

```sql
SELECT 
  id,
  name,
  email,
  alegra_invoice_id,
  alegra_invoice_number,
  alegra_invoice_pdf,
  payment_status
FROM bookings
WHERE alegra_invoice_id IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Error: "Credenciales de Alegra no configuradas"
- Verifica que `ALEGRA_USERNAME` y `ALEGRA_PASSWORD` estén en `.env`
- Reinicia el servidor después de agregar variables

### Error: "Product not found"
- Verifica que los IDs de productos sean correctos
- Los IDs deben ser numéricos (ej: `1`, `2`, no strings)

### Error: "Invalid tax id"
- Verifica el ID del impuesto IVA en Alegra
- Debe ser el ID numérico del registro de impuesto

### La factura no se crea
- Revisa los logs del backend: `[ALEGRA]`
- Verifica conexión con Alegra: `curl -u user:pass https://api.alegra.com/api/v1/company`
- Asegúrate de que el backend esté corriendo en puerto 3000

### La factura se crea pero sin IVA
- Verifica que el impuesto IVA esté configurado en Alegra
- El ID del tax debe ser correcto en `.env`
- Los productos deben tener asociado el impuesto

---

## 📝 Ejemplo Real

### Reserva de 5 m³ con transporte

**Entrada:**
- Volumen: 5 m³
- Items: 45
- Transporte: Recogida
- Cliente: Juan Pérez (CC 12345678)

**Cálculo de precios:**
- Almacenamiento mensual: $276,000 (sin IVA)
- IVA almacenamiento: $52,440 (19%)
- Transporte: $140,000 (sin IVA)
- IVA transporte: $26,600 (19%)
- **Total: $495,040**

**Factura en Alegra:**
```
Factura FV-0001

Cliente: Juan Pérez
CC: 12345678
Fecha: 2025-01-15
Vencimiento: 2025-02-14

Items:
1. Almacenamiento 5 m³ - Mes
   Cantidad: 1
   Precio: $276,000
   IVA 19%: $52,440
   Subtotal: $328,440

2. Transporte - Recogida
   Cantidad: 1
   Precio: $140,000
   IVA 19%: $26,600
   Subtotal: $166,600

TOTAL: $495,040
```

---

## ✅ Checklist Final

### Backend
- [ ] Servidor corriendo en puerto 3000
- [ ] Variables de entorno configuradas
- [ ] Endpoints `/api/alegra/*` respondiendo
- [ ] Logs `[ALEGRA]` mostrando actividad

### Alegra
- [ ] Cuenta activa de Alegra
- [ ] Credenciales API obtenidas
- [ ] Productos creados (Almacenamiento y Transporte)
- [ ] Impuesto IVA configurado
- [ ] IDs anotados en `.env`

### Supabase
- [ ] Columnas agregadas a tabla `bookings`
- [ ] Índice creado para búsqueda
- [ ] Datos de prueba visibles

### Frontend
- [ ] Hook `useAlegra` importado en `BookingScreen`
- [ ] Función de creación de factura integrada
- [ ] Logs del navegador mostrando actividad

### Testing
- [ ] Test manual ejecutado exitosamente
- [ ] Factura visible en Alegra
- [ ] Datos guardados en Supabase
- [ ] PDF descargable desde Alegra

---

## 🎯 Próximos Pasos Opcionales

1. **Webhook de Alegra → Supabase**
   - Recibir notificaciones cuando cambia estado de factura
   - Actualizar `payment_status` automáticamente

2. **Facturas recurrentes**
   - Crear factura mensual automática
   - Enviar recordatorios de pago

3. **Portal de cliente**
   - Mostrar facturas en el dashboard del usuario
   - Permitir descarga de PDFs

4. **Notas crédito**
   - Implementar devoluciones
   - Anular facturas desde el sistema

5. **Multi-moneda**
   - Soportar USD y EUR además de COP
   - Conversión automática

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del backend (prefijo `[ALEGRA]`)
2. Verifica las variables de entorno
3. Prueba la conexión con Alegra manualmente
4. Revisa la documentación completa en `ALEGRA_INTEGRATION.md`

**La integración está lista para usar!** 🎉
