-- Crear tabla de personas autorizadas
CREATE TABLE IF NOT EXISTS public.authorized_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('CC', 'CE', 'PP', 'TI')),
  document_number TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT, -- Relación con el usuario (familiar, amigo, empleado, etc.)
  can_pickup BOOLEAN DEFAULT true, -- Puede recoger objetos
  can_deliver BOOLEAN DEFAULT true, -- Puede entregar objetos
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_authorized_persons_user_id ON public.authorized_persons(user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_persons_booking_id ON public.authorized_persons(booking_id);
CREATE INDEX IF NOT EXISTS idx_authorized_persons_document ON public.authorized_persons(document_type, document_number);
CREATE INDEX IF NOT EXISTS idx_authorized_persons_active ON public.authorized_persons(is_active);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_authorized_persons_user_active ON public.authorized_persons(user_id, is_active);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_authorized_persons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_authorized_persons_updated_at
  BEFORE UPDATE ON public.authorized_persons
  FOR EACH ROW
  EXECUTE FUNCTION update_authorized_persons_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.authorized_persons ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios solo pueden ver sus propias personas autorizadas
CREATE POLICY "Users can view their own authorized persons"
  ON public.authorized_persons
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias personas autorizadas
CREATE POLICY "Users can insert their own authorized persons"
  ON public.authorized_persons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias personas autorizadas
CREATE POLICY "Users can update their own authorized persons"
  ON public.authorized_persons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias personas autorizadas
CREATE POLICY "Users can delete their own authorized persons"
  ON public.authorized_persons
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.authorized_persons IS 'Personas autorizadas para recoger/entregar objetos del usuario';
COMMENT ON COLUMN public.authorized_persons.user_id IS 'ID del usuario propietario';
COMMENT ON COLUMN public.authorized_persons.booking_id IS 'ID del booking asociado (opcional)';
COMMENT ON COLUMN public.authorized_persons.can_pickup IS 'Puede recoger objetos de la bodega';
COMMENT ON COLUMN public.authorized_persons.can_deliver IS 'Puede entregar objetos a la bodega';
COMMENT ON COLUMN public.authorized_persons.is_active IS 'Indica si la persona está activa (no eliminada)';
