-- ============================================
-- POLÍTICAS RLS PARA LA TABLA USERS
-- ============================================
-- Estas políticas aseguran que los usuarios solo puedan
-- ver y modificar sus propios datos

-- 1. Habilitar RLS en la tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Política para SELECT (lectura)
-- Los usuarios pueden ver solo su propia información
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Política para INSERT (creación)
-- Permitir que el sistema cree usuarios (necesario para el registro)
-- Solo se puede insertar si el id coincide con el usuario autenticado
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Política para UPDATE (actualización)
-- Los usuarios solo pueden actualizar su propia información
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Política para DELETE (eliminación)
-- Los usuarios pueden eliminar su propia cuenta (opcional)
CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- POLÍTICAS ADICIONALES (OPCIONAL)
-- ============================================

-- Si necesitas que el sistema pueda crear usuarios sin autenticación
-- (por ejemplo, durante el proceso de booking antes del registro)
-- puedes agregar esta política más permisiva para INSERT:

-- DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
-- CREATE POLICY "Allow system to create users"
--   ON public.users
--   FOR INSERT
--   WITH CHECK (true);

-- NOTA: Solo usa la política permisiva si tu flujo lo requiere
-- La política segura (Users can insert own data) es más recomendada


-- ============================================
-- VERIFICAR POLÍTICAS ACTIVAS
-- ============================================
-- Ejecuta este query para ver las políticas activas:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
