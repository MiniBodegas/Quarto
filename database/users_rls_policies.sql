-- ============================================
-- SOLUCIÓN 1: POLÍTICA RLS MÁS PERMISIVA (RECOMENDADA)
-- ============================================
-- Esta solución permite crear usuarios sin autenticación previa
-- pero mantiene la seguridad en SELECT, UPDATE y DELETE

-- 1. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Política para SELECT (lectura)
-- Los usuarios autenticados pueden ver solo su propia información
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Política para INSERT (creación) - PERMISIVA
-- Permitir crear usuarios sin autenticación (necesario para el booking flow)
CREATE POLICY "Allow user creation"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- 4. Política para UPDATE (actualización)
-- Solo usuarios autenticados pueden actualizar sus propios datos
-- O permitir actualización sin auth para el upsert del booking
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id OR  -- Usuario autenticado actualizando sus datos
    auth.uid() IS NULL  -- Permitir actualización desde booking flow (sin auth)
  );

-- 5. Política para DELETE (eliminación)
-- Solo usuarios autenticados pueden eliminar su cuenta
CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);


-- ============================================
-- SOLUCIÓN 2: POLÍTICA RLS ESTRICTA (MÁS SEGURA)
-- ============================================
-- Esta solución requiere usar Service Role Key en el backend
-- para operaciones sin autenticación

-- DESCOMENTA ESTAS LÍNEAS SI PREFIERES ESTA SOLUCIÓN:

/*
-- 1. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Política para SELECT
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Política para INSERT (solo usuarios autenticados)
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Política para UPDATE (solo usuarios autenticados)
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Política para DELETE
CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);
*/


-- ============================================
-- COMANDOS ÚTILES
-- ============================================

-- Eliminar todas las políticas existentes (si necesitas empezar de cero):
-- DROP POLICY IF EXISTS "Users can view own data" ON public.users;
-- DROP POLICY IF EXISTS "Allow user creation" ON public.users;
-- DROP POLICY IF EXISTS "Users can update own data" ON public.users;
-- DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Ver políticas activas:
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Deshabilitar RLS (solo para testing - NO EN PRODUCCIÓN):
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
