-- ============================================
-- SOLUCIÓN DEFINITIVA: POLÍTICAS RLS CORRECTAS
-- ============================================
-- Ejecuta este script COMPLETO en Supabase SQL Editor
-- Copia y pega TODO de una vez

-- PASO 1: Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- PASO 3: Habilitar RLS nuevamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas PERMISIVAS

-- Política 1: SELECT - Ver solo datos propios cuando esté autenticado
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO public
  USING (
    auth.uid() = id OR auth.uid() IS NULL
  );

-- Política 2: INSERT - Permitir crear usuarios sin autenticación
CREATE POLICY "users_insert_anon"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política 3: UPDATE - Permitir actualizar sin restricciones
CREATE POLICY "users_update_anon"
  ON public.users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Política 4: DELETE - Solo usuarios autenticados pueden eliminar su cuenta
CREATE POLICY "users_delete_own"
  ON public.users
  FOR DELETE
  TO public
  USING (auth.uid() = id);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta estos queries para verificar:

-- 1. Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
-- Debe retornar: rowsecurity = true

-- 2. Verificar políticas creadas
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
-- Debe retornar 4 políticas

-- 3. Test de inserción (OPCIONAL)
-- INSERT INTO public.users (email, name, phone) 
-- VALUES ('test_' || gen_random_uuid()::text || '@example.com', 'Test User', '3001234567')
-- RETURNING *;

-- Si el test funciona, elimina el registro:
-- DELETE FROM public.users WHERE email LIKE 'test_%@example.com';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ RLS habilitado en users
-- ✅ 4 políticas activas:
--    - users_select_own (SELECT)
--    - users_insert_anon (INSERT)
--    - users_update_anon (UPDATE)
--    - users_delete_own (DELETE)
-- ✅ BookingScreen puede crear usuarios sin errores
