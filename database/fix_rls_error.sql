-- ============================================
-- SOLUCIÓN INMEDIATA PARA ERROR 42501
-- "new row violates row-level security policy"
-- ============================================
-- Este script aplica las políticas RLS necesarias
-- para que el BookingScreen pueda crear usuarios sin autenticación

-- PASO 1: Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- PASO 2: Asegurar que RLS está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASO 3: Crear políticas permisivas para el flujo de booking

-- Política 1: SELECT (Lectura)
-- Los usuarios autenticados pueden ver solo sus propios datos
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Política 2: INSERT (Creación) - PERMISIVA ✅
-- Permitir crear usuarios sin autenticación (necesario para BookingScreen)
CREATE POLICY "Allow user creation"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Política 3: UPDATE (Actualización) - PERMISIVA ✅
-- Permitir actualizar usuarios sin autenticación (necesario para upsert en BookingScreen)
-- Y también permitir que usuarios autenticados actualicen sus propios datos
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id OR      -- Usuario autenticado actualizando sus datos
    auth.uid() IS NULL      -- Sin autenticación (flujo de booking)
  );

-- Política 4: DELETE (Eliminación)
-- Solo usuarios autenticados pueden eliminar su propia cuenta
CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta este query para verificar que las políticas se aplicaron correctamente:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================
-- TEST (OPCIONAL)
-- ============================================
-- Para probar que funciona, puedes ejecutar:
-- INSERT INTO public.users (email, name, phone) 
-- VALUES ('test@example.com', 'Test User', '3001234567');
-- 
-- Si funciona, elimina el registro de prueba:
-- DELETE FROM public.users WHERE email = 'test@example.com';
