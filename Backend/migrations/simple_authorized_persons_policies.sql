-- Opción 1: Deshabilitar RLS temporalmente para desarrollo
-- (Solo usar en desarrollo, nunca en producción)
ALTER TABLE public.authorized_persons DISABLE ROW LEVEL SECURITY;

-- Opción 2: Política más permisiva que permite a usuarios autenticados gestionar sus datos
-- (Más segura, recomendada)

-- Primero, eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can insert their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can update their own authorized persons" ON public.authorized_persons;
DROP POLICY IF EXISTS "Users can delete their own authorized persons" ON public.authorized_persons;

-- Habilitar RLS
ALTER TABLE public.authorized_persons ENABLE ROW LEVEL SECURITY;

-- Política simple: permitir todo a usuarios autenticados
CREATE POLICY "Authenticated users can manage authorized persons"
  ON public.authorized_persons
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- O si prefieres políticas más específicas pero permisivas:
-- CREATE POLICY "Enable read access for authenticated users" 
--   ON public.authorized_persons FOR SELECT 
--   TO authenticated 
--   USING (true);

-- CREATE POLICY "Enable insert for authenticated users" 
--   ON public.authorized_persons FOR INSERT 
--   TO authenticated 
--   WITH CHECK (true);

-- CREATE POLICY "Enable update for authenticated users" 
--   ON public.authorized_persons FOR UPDATE 
--   TO authenticated 
--   USING (true) 
--   WITH CHECK (true);

-- CREATE POLICY "Enable delete for authenticated users" 
--   ON public.authorized_persons FOR DELETE 
--   TO authenticated 
--   USING (true);
