-- Script para crear las tablas necesarias para el panel de administración

-- Eliminar tablas existentes si es necesario (cuidado: esto borra todos los datos)
DROP TABLE IF EXISTS public.access_logs CASCADE;
DROP TABLE IF EXISTS public.authorized_persons CASCADE;

-- Tabla de personas autorizadas (trabajadores, encargados, etc.)
-- Estas personas son gestionadas por el administrador y no están asociadas a un cliente específico
CREATE TABLE public.authorized_persons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text NULL DEFAULT 'CC',
  document_id text NOT NULL,
  phone text NULL,
  email text NULL,
  notes text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT authorized_persons_pkey PRIMARY KEY (id),
  CONSTRAINT authorized_persons_document_id_key UNIQUE (document_id)
) TABLESPACE pg_default;

-- Índices para authorized_persons
CREATE INDEX IF NOT EXISTS idx_authorized_persons_document_id ON public.authorized_persons(document_id);
CREATE INDEX IF NOT EXISTS idx_authorized_persons_is_active ON public.authorized_persons(is_active);

-- Tabla de logs de acceso (bitácora de entradas y salidas)
CREATE TABLE public.access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL,
  person_name text NOT NULL,
  document_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('entry', 'exit')),
  notes text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT access_logs_person_id_fkey FOREIGN KEY (person_id) 
    REFERENCES authorized_persons (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices para access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_person_id ON public.access_logs(person_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action);

-- Trigger para actualizar updated_at en authorized_persons
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_authorized_persons_updated_at ON public.authorized_persons;
CREATE TRIGGER update_authorized_persons_updated_at 
  BEFORE UPDATE ON public.authorized_persons 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.authorized_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para authorized_persons (solo admins pueden ver/modificar)
DROP POLICY IF EXISTS "Admins can view all authorized persons" ON public.authorized_persons;
CREATE POLICY "Admins can view all authorized persons" 
  ON public.authorized_persons FOR SELECT 
  USING (true); -- Ajustar según tu lógica de autenticación de admins

DROP POLICY IF EXISTS "Admins can insert authorized persons" ON public.authorized_persons;
CREATE POLICY "Admins can insert authorized persons" 
  ON public.authorized_persons FOR INSERT 
  WITH CHECK (true); -- Ajustar según tu lógica de autenticación de admins

DROP POLICY IF EXISTS "Admins can update authorized persons" ON public.authorized_persons;
CREATE POLICY "Admins can update authorized persons" 
  ON public.authorized_persons FOR UPDATE 
  USING (true); -- Ajustar según tu lógica de autenticación de admins

DROP POLICY IF EXISTS "Admins can delete authorized persons" ON public.authorized_persons;
CREATE POLICY "Admins can delete authorized persons" 
  ON public.authorized_persons FOR DELETE 
  USING (true); -- Ajustar según tu lógica de autenticación de admins

-- Políticas para access_logs (solo admins pueden ver/modificar)
DROP POLICY IF EXISTS "Admins can view all access logs" ON public.access_logs;
CREATE POLICY "Admins can view all access logs" 
  ON public.access_logs FOR SELECT 
  USING (true); -- Ajustar según tu lógica de autenticación de admins

DROP POLICY IF EXISTS "Admins can insert access logs" ON public.access_logs;
CREATE POLICY "Admins can insert access logs" 
  ON public.access_logs FOR INSERT 
  WITH CHECK (true); -- Ajustar según tu lógica de autenticación de admins

-- Comentarios para documentación
COMMENT ON TABLE public.authorized_persons IS 'Personas autorizadas por el administrador (trabajadores, encargados, etc.)';
COMMENT ON TABLE public.access_logs IS 'Bitácora de entradas y salidas de personas autorizadas';
COMMENT ON COLUMN public.authorized_persons.is_active IS 'Indica si la persona está actualmente autorizada';
COMMENT ON COLUMN public.access_logs.action IS 'Tipo de movimiento: entry (entrada) o exit (salida)';
