# 🚨 ERROR RLS PERSISTE - SOLUCIÓN PASO A PASO

## ❌ Error Actual
```
code: "42501"
message: 'new row violates row-level security policy for table "users"'
```

**El problema:** Las políticas RLS anteriores no se aplicaron correctamente o están mal configuradas.

---

## ✅ SOLUCIÓN RÁPIDA (Recomendada)

### Opción 1: Deshabilitar RLS Temporalmente (5 segundos)

**⚠️ SOLO PARA TESTING - NO USAR EN PRODUCCIÓN**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta este comando:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

3. **Prueba tu app** - El error debería desaparecer
4. **Después**, aplica la solución definitiva (Opción 2)

---

## ✅ SOLUCIÓN DEFINITIVA (10 minutos)

### Opción 2: Aplicar Políticas RLS Correctas

#### Paso 1: Abrir Supabase SQL Editor

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú lateral izquierdo)
4. Click en **New Query** (botón verde)

#### Paso 2: Ejecutar Script Completo

**Archivo:** `database/complete_rls_fix.sql`

1. **ABRE** el archivo `complete_rls_fix.sql`
2. **COPIA** TODO el contenido (desde línea 1 hasta el final)
3. **PEGA** en el SQL Editor de Supabase
4. **Click en RUN** (o presiona `Ctrl + Enter`)
5. Espera el mensaje de éxito

#### Paso 3: Verificar Políticas

En el mismo SQL Editor, ejecuta:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
```

**Resultado esperado (4 políticas):**
```
policyname          | cmd
--------------------+--------
users_delete_own    | DELETE
users_insert_anon   | INSERT
users_select_own    | SELECT
users_update_anon   | UPDATE
```

#### Paso 4: Test Final

Ejecuta este INSERT de prueba en SQL Editor:

```sql
INSERT INTO public.users (email, name, phone) 
VALUES ('test123@example.com', 'Test User', '3001234567')
RETURNING *;
```

**Si funciona:** Verás el usuario creado ✅

**Limpia el test:**
```sql
DELETE FROM public.users WHERE email = 'test123@example.com';
```

#### Paso 5: Probar en tu App

Ahora vuelve a tu aplicación y:
1. Completa el formulario de booking
2. Click en "Confirmar Reserva"
3. ✅ Debería funcionar sin errores

---

## 🔍 DIAGNÓSTICO: ¿Por Qué Persiste?

Posibles causas:

### Causa 1: Políticas No Aplicadas
- El script anterior no se ejecutó completamente
- Hubo algún error en la ejecución
- **Solución:** Ejecuta `complete_rls_fix.sql`

### Causa 2: Políticas Conflictivas
- Hay políticas antiguas que conflictúan
- **Solución:** El script `complete_rls_fix.sql` las elimina primero

### Causa 3: Permisos Insuficientes
- Tu usuario no tiene permisos para crear políticas
- **Solución:** Usa el usuario admin de Supabase

### Causa 4: Caché del Navegador
- El navegador tiene en caché el error
- **Solución:** Recarga la página (Ctrl + Shift + R)

---

## 📋 Scripts Disponibles

He creado 3 archivos SQL:

### 1️⃣ `disable_rls_temporary.sql` ⚡
**Uso:** Testing rápido
**Seguridad:** ⚠️ Baja (no usar en producción)
**Tiempo:** 5 segundos

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### 2️⃣ `complete_rls_fix.sql` ⭐ RECOMENDADO
**Uso:** Solución definitiva
**Seguridad:** ✅ Alta
**Tiempo:** 1 minuto

- Elimina políticas antiguas
- Crea políticas correctas
- Incluye verificación

### 3️⃣ `fix_rls_error.sql`
**Uso:** Primera versión del fix
**Problema:** Puede no funcionar si hay conflictos
**Usar:** `complete_rls_fix.sql` en su lugar

---

## 🎯 RECOMENDACIÓN FINAL

**Para resolver AHORA:**

1. Ejecuta `disable_rls_temporary.sql` → Tu app funcionará inmediatamente
2. Luego ejecuta `complete_rls_fix.sql` → Seguridad aplicada correctamente

**Comandos rápidos:**

```sql
-- 1. Deshabilitar RLS (temporal)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Prueba tu app (debería funcionar)

-- 3. Habilita RLS con políticas correctas
-- (ejecuta complete_rls_fix.sql completo)
```

---

## 🆘 Si AÚN No Funciona

### Debug Nivel 1: Verificar Estado RLS

```sql
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
```

### Debug Nivel 2: Ver Políticas Actuales

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

### Debug Nivel 3: Ver Logs de Supabase

1. Supabase Dashboard → **Logs** → **Postgres Logs**
2. Filtra por "users"
3. Busca errores RLS

### Debug Nivel 4: Probar con Service Role Key

**⚠️ SOLO PARA TESTING**

En `src/supabase.js`:

```javascript
// TEMPORAL - cambiar después
const supabaseKey = 'SERVICE_ROLE_KEY'; // Desde Supabase Settings → API
```

Si funciona con Service Role Key pero no con Anon Key, el problema son las políticas RLS.

---

## 📞 Necesitas Ayuda Extra?

Si después de ejecutar `complete_rls_fix.sql` aún tienes problemas:

1. **Copia el output** del SQL Editor
2. **Copia el resultado** de estas queries:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   SELECT rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```
3. **Copia el error completo** de la consola del navegador
4. Compártelo y te ayudo a debuggear

---

## ✅ Checklist de Verificación

Después de aplicar el fix:

- [ ] RLS está habilitado (`rowsecurity = true`)
- [ ] Hay 4 políticas activas
- [ ] INSERT de prueba funciona en SQL Editor
- [ ] BookingScreen puede crear usuarios
- [ ] No hay errores en consola del navegador
- [ ] El flujo completo funciona (booking → pago → registro)

---

**🚀 EJECUTA ESTO AHORA:**

```sql
-- Copia y pega en Supabase SQL Editor:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Luego prueba tu app. Una vez que funcione, ejecuta `complete_rls_fix.sql` para aplicar las políticas correctas.
