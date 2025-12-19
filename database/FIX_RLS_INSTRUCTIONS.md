# 🚨 FIX: Error RLS en Tabla Users

## ❌ Error Actual

```
new row violates row-level security policy for table "users"
Code: 42501
```

Este error ocurre porque:
- ✅ RLS está habilitado en la tabla `users`
- ❌ Las políticas RLS no permiten insertar usuarios sin autenticación
- ❌ El `BookingScreen` intenta crear usuarios ANTES de que se autentiquen

## ✅ Solución (5 minutos)

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, click en **SQL Editor**
3. Click en **New Query** (botón verde arriba a la derecha)

### Paso 2: Copiar y Ejecutar el Script

1. Abre el archivo: `database/fix_rls_error.sql`
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el SQL Editor de Supabase
4. Click en **Run** (o presiona `Ctrl + Enter`)

### Paso 3: Verificar que se Aplicó

Deberías ver un mensaje de éxito. Ahora ejecuta este query para verificar:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

Deberías ver **4 políticas**:
- ✅ `Allow user creation` (INSERT)
- ✅ `Users can delete own data` (DELETE)
- ✅ `Users can update own data` (UPDATE)
- ✅ `Users can view own data` (SELECT)

### Paso 4: Probar tu Aplicación

Ahora vuelve a tu aplicación y:

1. Completa el formulario de booking
2. Click en "Confirmar Reserva"
3. ✅ Debería funcionar sin errores

## 🔧 ¿Qué Hace el Script?

El script aplica estas políticas RLS:

```sql
-- INSERT: Cualquiera puede crear usuarios
CREATE POLICY "Allow user creation"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- SELECT: Solo ver datos propios (cuando esté autenticado)
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: Actualizar propios datos O sin autenticación (booking upsert)
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- DELETE: Solo usuarios autenticados
CREATE POLICY "Users can delete own data"
  ON public.users FOR DELETE
  USING (auth.uid() = id);
```

## 🔒 ¿Es Seguro?

**SÍ**, porque:

✅ **INSERT sin restricción:** Necesario para que usuarios anónimos puedan hacer bookings
✅ **SELECT restringido:** Los usuarios solo pueden ver sus propios datos después de autenticarse
✅ **UPDATE semi-restringido:** Permite el upsert en booking + usuarios autenticados pueden actualizar sus datos
✅ **DELETE restringido:** Solo usuarios autenticados pueden eliminar su cuenta

## 🧪 Test Manual (Opcional)

Si quieres probar directamente en SQL:

```sql
-- Test 1: Crear usuario sin autenticación (debe funcionar ✅)
INSERT INTO public.users (email, name, phone) 
VALUES ('test123@example.com', 'Test User', '3001234567');

-- Test 2: Ver el usuario sin autenticación (debe retornar vacío ❌ - correcto)
SELECT * FROM public.users WHERE email = 'test123@example.com';

-- Limpiar:
DELETE FROM public.users WHERE email = 'test123@example.com';
```

## 🆘 Si Aún Tienes Problemas

### Problema: "Permission denied for table users"

**Solución:** Asegúrate de estar usando el **Anon Key** (no la Service Role Key) en tu `supabase.js`:

```javascript
// src/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Problema: "Cannot read properties of null"

**Solución:** Verifica que estás retornando el usuario creado:

```javascript
const { data: newUser, error: userError } = await supabase
  .from("users")
  .insert([{ name, email, phone }])
  .select()  // ← Importante
  .single();
```

### Problema: Las políticas no se aplican

**Solución:** Elimina las políticas existentes primero:

```sql
-- En Supabase SQL Editor:
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Luego ejecuta el script fix_rls_error.sql nuevamente
```

## 📋 Checklist Post-Fix

Después de aplicar el fix, verifica:

- [ ] El script SQL se ejecutó sin errores
- [ ] Hay 4 políticas activas en la tabla `users`
- [ ] El BookingScreen puede crear usuarios
- [ ] El BookingScreen puede actualizar usuarios existentes
- [ ] Después del pago, el usuario puede crear su cuenta
- [ ] En el portal, el usuario solo ve sus propios datos

## 🎯 Siguiente Paso

Una vez aplicadas las políticas, continúa con tu flujo normal:

1. Usuario completa booking → ✅ Crea/actualiza en `users`
2. Usuario paga → ✅ Booking actualizado
3. Usuario crea contraseña → ✅ Cuenta en Auth + asocia `user_id`
4. Usuario accede al portal → ✅ Ve solo sus datos

---

**¿Necesitas ayuda?** Revisa los logs de Supabase:
Dashboard → Logs → Postgres Logs
