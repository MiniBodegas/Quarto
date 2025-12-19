# 🔧 Cómo Agregar Columnas de Precio a la Tabla `bookings`

## 🎯 Problema
Los campos `amount_total`, `amount_monthly` y otros campos de precio no existen en la tabla `bookings` de Supabase, por lo que no se pueden guardar los precios.

## ✅ Solución

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. En el menú lateral, click en **"SQL Editor"**
3. Click en **"New query"**

### Paso 2: Ejecutar el Script

Copia y pega el contenido completo del archivo:
```
database/add_booking_price_columns.sql
```

### Paso 3: Ejecutar

1. Click en el botón **"Run"** (o presiona Ctrl+Enter)
2. Verás mensajes como:
   ```
   NOTICE: Columna amount_total agregada
   NOTICE: Columna amount_monthly agregada
   NOTICE: Columna storage_months agregada
   ...
   ```

### Paso 4: Verificar

Al final del script, verás una tabla mostrando las columnas agregadas:

| column_name | data_type | is_nullable | column_default |
|------------|-----------|-------------|----------------|
| amount_monthly | numeric | YES | NULL |
| amount_total | numeric | YES | NULL |
| due_date | timestamp with time zone | YES | NULL |
| internal_token | text | YES | NULL |
| invoice_number | text | YES | NULL |
| logistics_method | text | YES | NULL |
| storage_months | integer | YES | 1 |
| total_items | integer | YES | NULL |
| total_volume | numeric | YES | NULL |
| transport_price | numeric | YES | 0 |

## 📋 Columnas que se agregan

### Campos de Precio
- `amount_total` (numeric): Monto total a pagar (mensualidad + transporte)
- `amount_monthly` (numeric): Monto mensual base (sin transporte)
- `transport_price` (numeric): Costo del transporte
- `storage_months` (integer): Meses contratados

### Campos de Facturación
- `invoice_number` (text): Número de factura generado
- `due_date` (timestamp): Fecha límite de pago

### Campos de Identificación
- `internal_token` (text): Token único interno para identificar la reserva

### Campos de Reserva
- `booking_type` (text): Tipo de reserva ('person' o 'company')
- `company_name` (text): Nombre de empresa (si aplica)
- `company_nit` (text): NIT de empresa (si aplica)

### Campos de Almacenamiento
- `total_volume` (numeric): Volumen total en m³
- `total_items` (integer): Cantidad total de items
- `logistics_method` (text): Método logístico

## 🔍 Verificar Manualmente

Si quieres verificar las columnas existentes antes de ejecutar el script:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;
```

## ⚠️ Notas Importantes

1. **Script idempotente**: El script verifica si las columnas existen antes de crearlas, así que es seguro ejecutarlo múltiples veces.

2. **Sin pérdida de datos**: Solo agrega columnas nuevas, no modifica ni elimina datos existentes.

3. **Índices**: El script crea índices para mejorar el rendimiento de las consultas.

4. **Valores NULL**: Las columnas permiten NULL porque los bookings existentes no tendrán estos valores.

## 🚀 Después de Ejecutar

Una vez ejecutado el script:

1. ✅ Los precios se guardarán correctamente en nuevos bookings
2. ✅ Las facturas mostrarán el monto correcto
3. ✅ El botón "Pagar con Wompi" funcionará con el precio real
4. ✅ Los reportes y análisis tendrán datos de precio

## 🧪 Probar

Después de ejecutar el script, prueba crear un nuevo booking:

1. Ve a la calculadora
2. Agrega items
3. Completa el formulario de booking
4. Verifica en Supabase → Table Editor → bookings
5. Deberías ver los campos `amount_total` y `amount_monthly` llenos

## 🆘 Si algo sale mal

Si ves algún error, copia el mensaje completo y compártelo para ayudarte a resolverlo.

Errores comunes:
- **"permission denied"**: Asegúrate de estar conectado con permisos de administrador
- **"column already exists"**: La columna ya existe, esto es normal
- **"syntax error"**: Asegúrate de copiar TODO el script completo
