# 📄 Integración con Alegra - Sistema de Facturación

## 📋 Descripción General

Esta integración permite crear facturas electrónicas automáticamente en Alegra cuando un usuario completa una reserva en Quarto. También registra los pagos confirmados por Wompi en el sistema de facturación.

---

## 🔧 Configuración Inicial

### 1. Credenciales de Alegra

Debes obtener tus credenciales de acceso a la API de Alegra:

1. Inicia sesión en tu cuenta de Alegra
2. Ve a **Configuración → Usuarios y permisos → Integraciones**
3. Crea un nuevo usuario API o usa el existente
4. Guarda el **Usuario** y **Contraseña** (tokens de API)

### 2. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` en el **Backend**:

```env
# Alegra API
ALEGRA_API_URL=https://api.alegra.com/api/v1
ALEGRA_USERNAME=tu_usuario_alegra
ALEGRA_PASSWORD=tu_password_alegra

# IDs de Productos/Servicios en Alegra (debes crearlos primero)
ALEGRA_PRODUCT_STORAGE_ID=1
ALEGRA_PRODUCT_TRANSPORT_ID=2
ALEGRA_TAX_IVA_ID=1
```

### 3. Crear Productos/Servicios en Alegra

Antes de usar la integración, debes crear los productos en Alegra:

#### Producto 1: Almacenamiento Mensual
- **Nombre**: Almacenamiento Mensual
- **Referencia**: `STORAGE-MONTHLY`
- **Precio**: Variable (se calcula dinámicamente)
- **Impuesto**: IVA 19%
- **Categoría**: Servicios

#### Producto 2: Transporte
- **Nombre**: Servicio de Transporte
- **Referencia**: `TRANSPORT`
- **Precio**: Variable (se calcula dinámicamente)
- **Impuesto**: IVA 19%
- **Categoría**: Servicios

Después de crear los productos, anota sus **IDs** y actualiza las variables de entorno.

### 4. Configurar Impuestos

Asegúrate de tener configurado el IVA en Alegra:
- **Nombre**: IVA
- **Porcentaje**: 19%
- **Tipo**: Impuesto sobre ventas

Anota el **ID** del impuesto y actualiza `ALEGRA_TAX_IVA_ID`.

---

## 🚀 Flujo de Integración

### Paso 1: Usuario completa reserva
1. Usuario llena el formulario de BookingScreen
2. Se crea el registro en la tabla `bookings` de Supabase
3. Se genera un `booking_id` único

### Paso 2: Creación automática de factura
4. El sistema envía una solicitud a `/api/alegra/create-invoice`
5. El backend busca o crea el cliente en Alegra
6. Se genera el payload de items según el formato de Alegra
7. Se crea la factura electrónica en Alegra
8. Se guarda la referencia de la factura en el booking:
   - `alegra_invoice_id`
   - `alegra_invoice_number`
   - `alegra_invoice_pdf`

### Paso 3: Usuario realiza el pago con Wompi
9. Usuario confirma y va a la pantalla de pago
10. Se genera la transacción en Wompi
11. Wompi envía un webhook al completarse el pago

### Paso 4: Registro de pago en Alegra
12. El webhook de Wompi actualiza el `payment_status` a `APPROVED`
13. Se envía solicitud a `/api/alegra/register-payment`
14. El backend registra el pago en la factura de Alegra
15. La factura queda marcada como pagada en ambos sistemas

---

## 📊 Estructura de Datos

### Payload de Factura (Alegra)

```javascript
{
  "date": "2025-01-15",           // Fecha de emisión (yyyy-MM-dd)
  "dueDate": "2025-02-14",        // Fecha de vencimiento (30 días después)
  "client": {
    "id": 12345                   // ID del cliente en Alegra
  },
  "items": [
    {
      "id": 1,                    // ID del producto en Alegra
      "reference": "STORAGE-MONTHLY",
      "description": "Almacenamiento 5.5 m³ - Mes",
      "quantity": 1,
      "price": 276000,            // Precio SIN IVA
      "tax": [{
        "id": 1,
        "name": "IVA",
        "percentage": 19,
        "amount": 52440           // IVA calculado
      }]
    },
    {
      "id": 2,
      "reference": "TRANSPORT",
      "description": "Transporte - Recogida",
      "quantity": 1,
      "price": 140000,
      "tax": [{
        "id": 1,
        "name": "IVA",
        "percentage": 19,
        "amount": 26600
      }]
    }
  ],
  "observations": "Reserva #abc123\nVolumen: 5.5 m³\nItems: 45",
  "termsConditions": "Pago mediante Wompi. Servicio mensual.",
  "stamp": {
    "generateStamp": true         // Genera timbre electrónico DIAN
  }
}
```

### Respuesta de Alegra

```javascript
{
  "success": true,
  "invoice": {
    "id": 67890,
    "number": "FV-0001",
    "pdfUrl": "https://app.alegra.com/invoices/67890.pdf",
    "status": "open",
    "total": 495040,              // Total con IVA
    "balance": 495040             // Saldo pendiente
  }
}
```

---

## 🔌 Endpoints del Backend

### POST `/api/alegra/create-invoice`

Crea una factura en Alegra basada en un booking.

**Request:**
```json
{
  "bookingId": "abc123",
  "clientData": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "3001234567",
    "document_type": "CC",
    "document_number": "12345678",
    "booking_type": "person"
  },
  "invoiceData": {
    "amount_monthly": 276000,
    "transport_price": 140000,
    "total_volume": 5.5,
    "total_items": 45,
    "logistics_method": "Recogida",
    "inventory": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": 67890,
    "number": "FV-0001",
    "pdfUrl": "https://...",
    "status": "open",
    "total": 495040,
    "balance": 495040
  }
}
```

### POST `/api/alegra/register-payment`

Registra un pago en una factura de Alegra.

**Request:**
```json
{
  "invoiceId": "67890",
  "amount": 495040,
  "transactionId": "WOMPI-123456",
  "paymentDate": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": 98765,
    "date": "2025-01-15",
    "amount": 495040,
    "status": "approved"
  }
}
```

---

## 🧪 Testing

### Probar conexión con Alegra

```bash
curl -X GET https://api.alegra.com/api/v1/company \
  -u "tu_usuario:tu_password"
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "name": "Mi Empresa SAS",
  "email": "contacto@miempresa.com",
  ...
}
```

### Probar creación de factura

```bash
curl -X POST http://localhost:3000/api/alegra/create-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "clientData": {
      "name": "Cliente Test",
      "email": "test@test.com",
      "phone": "3001111111",
      "document_type": "CC",
      "document_number": "11111111",
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

---

## 📦 Estructura de Archivos

```
Backend/
  └── server.js                    # Endpoints de Alegra

src/
  ├── services/
  │   └── alegraService.js         # Servicio de integración (frontend)
  ├── hooks/
  │   └── useAlegra.js             # Hook React para Alegra
  └── Components/
      └── calculator/
          └── BookingScreen.jsx    # Integración en reserva
```

---

## 🔍 Debugging

### Activar logs detallados

En `server.js`, los logs ya están configurados con prefijo `[ALEGRA]`:

```javascript
console.log("[ALEGRA] Creando factura:", payload);
console.log("[ALEGRA] ✅ Factura creada:", invoice.id);
console.error("[ALEGRA] Error:", error);
```

### Revisar factura en Alegra

1. Inicia sesión en Alegra
2. Ve a **Ventas → Facturas de venta**
3. Busca por número de factura o nombre del cliente
4. Verifica:
   - Items correctos
   - Impuestos calculados (19% IVA)
   - Total correcto
   - PDF generado

### Verificar en Supabase

Revisa que el booking tenga los campos actualizados:

```sql
SELECT 
  id,
  alegra_invoice_id,
  alegra_invoice_number,
  alegra_invoice_pdf,
  payment_status
FROM bookings
WHERE id = 'tu-booking-id';
```

---

## ⚠️ Consideraciones Importantes

### 1. **Precios sin IVA**
Los precios que envías a Alegra **NO deben incluir IVA**. El sistema calcula automáticamente el 19% sobre cada item.

```javascript
// ❌ MAL
price: 328440  // Precio con IVA incluido

// ✅ BIEN
price: 276000  // Precio base
tax: [{ percentage: 19, amount: 52440 }]  // IVA calculado
```

### 2. **Clientes duplicados**
El sistema busca clientes existentes por email antes de crear uno nuevo. Si cambias el email de un cliente, se creará un nuevo registro en Alegra.

### 3. **Facturación electrónica**
Si tienes habilitada la facturación electrónica DIAN en Alegra, las facturas se envían automáticamente a la DIAN con el parámetro:

```javascript
stamp: { generateStamp: true }
```

### 4. **Ambiente de prueba**
Alegra no tiene ambiente sandbox. Crea una cuenta de prueba gratuita para testing.

### 5. **Rate Limiting**
Alegra tiene límites de requests por minuto. El plan gratuito permite ~60 requests/min.

---

## 🔐 Seguridad

### ✅ Buenas prácticas implementadas:

1. **Credenciales en backend**: Las credenciales de Alegra NUNCA se exponen en el frontend
2. **Autenticación Basic**: Se usa el header `Authorization: Basic base64(user:pass)`
3. **Validación de datos**: Se validan todos los campos antes de enviar a Alegra
4. **Manejo de errores**: Todos los errores se capturan y registran sin exponer detalles sensibles
5. **CORS configurado**: Solo orígenes autorizados pueden acceder al backend

### ⚠️ NO hacer:

- ❌ NO expongas `ALEGRA_USERNAME` y `ALEGRA_PASSWORD` en el frontend
- ❌ NO guardes credenciales en localStorage o cookies
- ❌ NO hagas requests directos a Alegra desde el navegador
- ❌ NO comitees el archivo `.env` al repositorio

---

## 📝 Actualizar Schema de Supabase

Agrega las columnas de Alegra a la tabla `bookings`:

```sql
ALTER TABLE bookings
ADD COLUMN alegra_invoice_id TEXT,
ADD COLUMN alegra_invoice_number TEXT,
ADD COLUMN alegra_invoice_pdf TEXT;

-- Crear índice para búsqueda rápida
CREATE INDEX idx_bookings_alegra_invoice 
ON bookings(alegra_invoice_id);
```

---

## 🆘 Solución de Problemas

### Error: "Credenciales de Alegra no configuradas"
**Causa**: Faltan variables de entorno
**Solución**: Verifica que `ALEGRA_USERNAME` y `ALEGRA_PASSWORD` estén en `.env`

### Error: "Error creando cliente: Identification already exists"
**Causa**: Ya existe un cliente con ese documento en Alegra
**Solución**: El sistema debería encontrarlo automáticamente. Revisa que la búsqueda por email funcione correctamente.

### Error: "Invalid tax id"
**Causa**: El ID del impuesto IVA no es correcto
**Solución**: Busca el ID real del IVA en Alegra:
```bash
curl -X GET https://api.alegra.com/api/v1/taxes \
  -u "usuario:password"
```

### Error: "Product not found"
**Causa**: Los IDs de productos no existen en Alegra
**Solución**: Crea los productos manualmente y actualiza los IDs en `.env`

### La factura se crea pero sin IVA
**Causa**: El ID del tax no es correcto o el tax no está asociado al producto
**Solución**: Verifica que `ALEGRA_TAX_IVA_ID` sea el ID correcto del impuesto configurado.

---

## 📚 Recursos

- [Documentación oficial de Alegra API](https://developer.alegra.com/docs)
- [Referencia de Invoices](https://developer.alegra.com/docs/invoices)
- [Referencia de Contacts](https://developer.alegra.com/docs/contacts)
- [Referencia de Payments](https://developer.alegra.com/docs/payments)

---

## ✅ Checklist de Implementación

- [ ] Crear cuenta de Alegra (prueba o producción)
- [ ] Obtener credenciales API (usuario y password)
- [ ] Crear productos en Alegra (Almacenamiento y Transporte)
- [ ] Configurar impuesto IVA en Alegra
- [ ] Anotar IDs de productos e impuestos
- [ ] Agregar variables de entorno en `.env` del backend
- [ ] Actualizar schema de Supabase con columnas de Alegra
- [ ] Probar conexión con endpoint `/api/alegra/create-invoice`
- [ ] Verificar creación de factura en panel de Alegra
- [ ] Probar registro de pago después de transacción Wompi
- [ ] Configurar facturación electrónica DIAN (producción)

---

## 🎯 Próximos Pasos

1. **Automatizar pagos recurrentes**: Crear facturas mensuales automáticas
2. **Notas crédito**: Implementar anulaciones y devoluciones
3. **Reportes**: Integrar reportes de facturación desde Alegra
4. **Multi-empresa**: Permitir múltiples empresas con diferentes cuentas Alegra
5. **Webhooks de Alegra**: Recibir notificaciones cuando cambia el estado de una factura

---

**¿Necesitas ayuda?** Revisa los logs del backend con prefijo `[ALEGRA]` para diagnosticar problemas.
