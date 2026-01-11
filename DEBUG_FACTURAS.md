# 🔍 Debug - Facturas Mostrando PENDING

El problema es que las facturas en el admin panel siguen mostrando "PENDING" incluso después de cambiarlas a "APPROVED" en la BD.

## Pasos para Investigar

### 1️⃣ Verifica el estado REAL en la BD
Accede a tu panel de Supabase y ejecuta una query SQL:

```sql
SELECT id, name, payment_status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;
```

**¿Ves que `payment_status` dice "APPROVED"?** ✅
- Si SÍ → El problema está en la API (endpoint retorna data vieja)
- Si NO → El problema está en que no se está guardando correctamente

---

### 2️⃣ Verifica lo que la API está retornando
Abre tu navegador y accede a:

```
http://localhost:3000/api/debug/all-invoices
```

Deberías ver un JSON con:
- `statusBreakdown`: Cuántos tienen "PENDING", "APPROVED", etc.
- `invoices`: Lista de las últimas 20 facturas con status actual

**Compara esto con lo que viste en Supabase.** ¿Coinciden los status?

---

### 3️⃣ Si ves diferencias
- **En Supabase dice APPROVED pero la API retorna PENDING:**
  - Significa que la API está cacheando datos
  - Solución: Hacer refresh en el navegador (Ctrl+F5)
  - O reiniciar el servidor backend

- **En Supabase dice PENDING pero tú lo cambiaste a APPROVED:**
  - Tu cambio manual NO se está guardando
  - Verifica que realmente hayas hecho click en "UPDATE"
  - Verifica los permisos de Supabase

---

### 4️⃣ Reinicia el Backend
Si todo se ve correcto en Supabase pero la API retorna data vieja:

```bash
# En la terminal del Backend, presiona Ctrl+C
# Luego:
npm run dev
```

Esto fuerza la reconexión a Supabase.

---

### 5️⃣ Limpia el Cache del Navegador
En AdminInvoices, AdminClients, etc., ahora hay botones de **"Refrescar"**.

Haz clic en ellos después de cambiar status en Supabase. Esto fuerza una nueva llamada a la API.

---

## URLs de Debug

| Endpoint | Descripción |
|----------|-----------|
| `GET /api/debug/all-invoices` | Ver últimas 20 facturas con status |
| `GET /api/debug/booking/[ID]` | Ver un booking específico |
| `GET /api/debug/bookings/recent/10` | Ver últimos 10 bookings |

---

## Checklist

- [ ] Verificar status en Supabase (query SQL)
- [ ] Verificar `/api/debug/all-invoices` en navegador
- [ ] Comparar ambas respuestas
- [ ] Reiniciar backend si hay diferencias
- [ ] Usar botón "Refrescar" en admin panel
- [ ] Ctrl+F5 en navegador si aún ves datos viejos

---

## Problema Más Probable

**El `payment_status` en `bookings` nunca fue guardado como "APPROVED" en la primera instancia.**

Cuando Wompi webhook debería guardar APPROVED, algo falla silenciosamente.

Ve a `/api/debug/all-invoices` y comparte conmigo:
1. ¿Cuántos bookings tienen status NULL o PENDING?
2. ¿Hay alguno con APPROVED?
3. Los timestamps (¿cuándo se crearon?)

Esto me dirá si el webhook está funcionando o si necesitamos investigar más a fondo.
