# Cambios en Sistema de Inventario

## Archivos Modificados

### 1. `/src/Screen/Calculator/Calculator.jsx`
**Líneas clave:** 26-37, 42-49, 136-202, 263-399, 477-495, 642-650

**Cambios:**
- Agregado estado `isAddingToExisting` y `existingBookingId`
- Nuevo action `SET_ADDING_MODE` en reducer
- Nuevo action `SAVE_ITEMS_TO_EXISTING` en reducer
- useEffect que detecta flag `quarto_adding_items` en localStorage
- Verifica sesión → cuenta en users → bookings activos
- Si tiene bookings, dispatch `SET_ADDING_MODE` con bookingId
- Función `handleSaveItemsToExisting()` que:
  - Obtiene booking actual
  - Calcula nuevos totales (volumen + items)
  - Inserta items en tabla `inventory`
  - Actualiza booking con nuevos totales
  - Crea factura en tabla `invoices`
- FinalSummaryScreen recibe prop `isAddingToExisting`
- onClick de botón verifica si es modo agregar items

### 2. `/src/Screen/UserScreen/UserScreen.jsx`
**Líneas clave:** 215-244, 252-298, 375-430

**Cambios:**
- Busca bookings por user_id (línea 200-214)
- Busca bookings por email SIN filtro `is('user_id', null)` (línea 217-244)
  - Encuentra TODOS los bookings del mismo email
  - Actualiza user_id si es diferente
  - Combina sin duplicar
- Carga facturas REALES de tabla `invoices` (línea 254-295)
- Combina facturas reales + facturas de bookings
- Mapea inventario agregando `storage_unit_id = booking_id` (línea 421-428)
- **CRÍTICO:** Solo llama `setUserInventory()` UNA VEZ con storage_unit_id mapeado

### 3. `/src/Components/Inventory.jsx`
**Líneas clave:** 59-74, 287-302

**Cambios:**
- Filtra items por `storage_unit_id === selectedUnitId`
- Logs de diagnóstico agregados (líneas 7-24, 59-74)
- Botón "Agregar Más Items" (línea 287-302):
  - Guarda flag `quarto_adding_items` en localStorage
  - Navega a `/` (calculadora)

### 4. `/src/Components/calculator/FinalSummaryScreen.jsx`
**Línea 6, 76-96**

**Cambios:**
- Recibe prop `isAddingToExisting`
- Cambia texto del botón principal según modo
- Oculta botón "Enviar cotización" si es modo agregar items

### 5. `/src/Components/calculator/ConfirmationScreen.jsx`
**Líneas 1-100+**

**Cambios:**
- Recibe props `isAddingToExisting` e `invoiceInfo`
- Mensajes diferentes según modo
- Muestra card de factura con:
  - Número de factura
  - Items agregados
  - Volumen adicional
  - Nuevo monto mensual
- Botones: "Volver al Portal" + "Agregar más items"

### 6. `/src/router/appRouter.jsx`
**Cambios:**
- Eliminada ruta `/add-items` (ya no se usa)
- Eliminado import de `AddItemsToInventory`

### 7. `/src/Components/index.js`
**Cambios:**
- Eliminado export de `AddItemsToInventory`

## Flujo Completo

### A. Usuario Agrega Items desde Portal

```
1. Portal → Inventario → Click "Agregar Más Items"
   ↓
2. Inventory.jsx guarda: localStorage.setItem('quarto_adding_items', 'true')
   ↓
3. navigate('/') → Calculator.jsx
   ↓
4. useEffect detecta flag en localStorage
   ↓
5. Verifica:
   - ¿Hay sesión? → Sí
   - ¿Usuario existe en tabla users? → Busca por email
   - ¿Tiene bookings activos? → SELECT * FROM bookings WHERE user_id = xxx
   ↓
6. Si tiene bookings → dispatch({ type: 'SET_ADDING_MODE', payload: { bookingId } })
   ↓
7. Usuario selecciona items en calculadora
   ↓
8. FinalSummary → Click "Agregar Items a mi Inventario"
   ↓
9. handleSaveItemsToExisting():
   - INSERT items INTO inventory (booking_id = existingBookingId)
   - UPDATE bookings SET total_volume = nuevo, total_items = nuevo
   - INSERT INTO invoices (factura por items adicionales)
   ↓
10. ConfirmationScreen muestra:
    - Número de factura
    - Items agregados
    - Nuevo costo mensual
```

### B. UserScreen Carga Inventario

```
1. useEffect en UserScreen
   ↓
2. loadUserData(userId):
   a. SELECT * FROM bookings WHERE user_id = userId
   b. SELECT * FROM bookings WHERE email = userEmail (sin filtro user_id)
   c. UPDATE bookings SET user_id = userId (consolidar)
   ↓
3. SELECT * FROM invoices WHERE user_id = userId
   ↓
4. SELECT * FROM inventory WHERE booking_id IN (bookingIds)
   ↓
5. MAP inventory: item.storage_unit_id = item.booking_id
   ↓
6. setUserInventory(inventoryWithUnits) ← UNA SOLA VEZ
   ↓
7. Inventory.jsx filtra: items.filter(i => i.storage_unit_id === selectedUnitId)
```

## Problemas Conocidos y Soluciones

### Problema 1: Items no se muestran
**Causa:** `storage_unit_id` no mapeado o mapeado tarde
**Solución:** UserScreen.jsx líneas 421-428 - mapear ANTES de setUserInventory

### Problema 2: No encuentra bookings
**Causa:** user_id diferente del auth.uid(), busca solo por user_id
**Solución:** UserScreen.jsx líneas 217-244 - buscar por EMAIL sin filtro user_id

### Problema 3: Items no se guardan al agregar
**Causa:** Columna 'category' no existe en tabla inventory
**Solución:** Calculator.jsx líneas 285-301 - usar estructura correcta (booking_id, item_id, name, quantity, volume, is_custom, short_code)

### Problema 4: No se genera factura
**Causa:** No se insertaba en tabla invoices
**Solución:** Calculator.jsx líneas 368-388 - INSERT INTO invoices con status PENDING

## Variables de Estado Importantes

### localStorage
- `quarto_adding_items`: 'true' cuando viene desde Inventory
- `quarto_current_booking_id`: ID del booking actual (flujo normal)
- `quarto_booking_form`: Datos del formulario de booking

### Calculator State
- `isAddingToExisting`: true/false
- `existingBookingId`: UUID del booking existente
- `invoiceInfo`: { invoiceNumber, amount, itemsAdded, volumeAdded }

### UserScreen State
- `userInventory`: Array de items con storage_unit_id
- `userStorageUnits`: Array de "bodegas" (uno por booking)
- `userInvoices`: Facturas reales + facturas de bookings

## Tablas de Base de Datos

### bookings
- `id` (PK)
- `user_id` (FK users) ← Puede ser diferente del auth.uid()
- `email` ← Usar para búsqueda
- `total_volume` ← Actualizar al agregar items
- `total_items` ← Actualizar al agregar items
- `amount_monthly` ← Recalcular con PRICE_LIST

### inventory
- `id` (PK)
- `booking_id` (FK bookings) ← storage_unit_id
- `item_id` (FK items o NULL)
- `custom_item_id` (FK custom_items o NULL)
- `name`
- `quantity`
- `volume`
- `is_custom`
- `short_code` ← Código único de 6 caracteres

### invoices (nueva funcionalidad)
- `id` (PK)
- `user_id` (FK users)
- `booking_id` (FK bookings)
- `invoice_number` ← "INV-timestamp-random"
- `amount` ← Nuevo monto mensual total
- `status` ← PENDING/PAID
- `description` ← "Items adicionales agregados (+2.5m³, 5 items)"

## Logs de Diagnóstico

### Calculator
```
[Calculator] 🔍 Usuario viene desde Inventory
[Calculator] 📧 Email del usuario: xxx
[Calculator] ✅ Usuario tiene cuenta registrada
[Calculator] 🎉 Usuario con bookings activos
[Calculator] 🎯 Booking ID a usar: xxx
[Calculator] 💾 Guardando items al booking existente
[Calculator] 📦 Items a insertar: X
[Calculator] ✅ Items guardados en inventory
[Calculator] ✅ Booking actualizado
[Calculator] ✅ Factura creada: INV-xxx
```

### UserScreen
```
[UserScreen] 🔎 Buscando bookings con user_id: xxx
[UserScreen] 🔎 Buscando bookings por email: xxx
[UserScreen] 🔗 Asociando X bookings al user_id: xxx
[UserScreen] ✅ Facturas reales encontradas: X
[UserScreen] 📦 Inventario asociado a unidades: Array(X)
```

### Inventory
```
[Inventory] Props recibidas: { itemsCount: X, storageUnitsCount: X }
[Inventory] Storage Units: [...]
[Inventory] Inicializando con unidad: xxx
[Inventory] Filtrando items: { selectedUnitId: xxx, totalItems: X }
[Inventory] Items filtrados para unidad xxx: X
```

## Siguiente Paso para Debug

Si los items NO aparecen, verificar en orden:

1. **Consola del navegador:**
   ```
   [UserScreen] 📦 Inventario asociado a unidades: Array(?)
   ```
   - ¿Cuántos items?
   - ¿Tienen storage_unit_id?

2. **Consola del navegador:**
   ```
   [Inventory] Props recibidas: { itemsCount: ? }
   [Inventory] Storage Units: [...]
   [Inventory] Items filtrados para unidad xxx: ?
   ```
   - ¿itemsCount es > 0?
   - ¿selectedUnitId tiene valor?
   - ¿Items filtrados es 0?

3. **Muestra de items:**
   ```
   [Inventory] Muestra de items: [
     {name: "...", storage_unit_id: "xxx", booking_id: "xxx"}
   ]
   ```
   - ¿storage_unit_id coincide con algún Storage Unit?

4. **Base de datos:**
   - SELECT * FROM inventory WHERE booking_id IN (lista de bookings)
   - ¿Hay items?
   - ¿booking_id es correcto?
