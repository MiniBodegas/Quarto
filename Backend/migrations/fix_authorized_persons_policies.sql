-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can insert their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can update their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can delete their own authorized persons" ON public.authorized_persons;

-- Crear nuevas políticas más permisivas (temporalmente para desarrollo)
-- En producción, ajusta según tu esquema de autenticación

-- Política de SELECT: Los usuarios pueden ver sus propias personas autorizadas
CREATE POLICY "Users can view their own authorized persons"
  ON public.authorized_persons
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  );

-- Política de INSERT: Los usuarios pueden insertar personas autorizadas para sí mismos
CREATE POLICY "Users can insert their own authorized persons"
  ON public.authorized_persons
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  );

-- Política de UPDATE: Los usuarios pueden actualizar sus propias personas autorizadas
CREATE POLICY "Users can update their own authorized persons"
  ON public.authorized_persons
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  );

-- Política de DELETE: Los usuarios pueden eliminar sus propias personas autorizadas
CREATE POLICY "Users can delete their own authorized persons"
  ON public.authorized_persons
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  );

-- Verificar que RLS esté habilitado
ALTER TABLE public.authorized_persons ENABLE ROW LEVEL SECURITY;
