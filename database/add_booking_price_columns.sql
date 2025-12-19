-- ================================================
-- Script para agregar columnas de precio a bookings
-- ================================================
-- Este script agrega SOLO las columnas de precio que faltan
-- en la tabla bookings actual
-- ================================================

-- 1. Verificar columnas existentes (opcional)
/*
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;
*/

-- 2. Agregar SOLO las columnas de precio que faltan
DO $$ 
BEGIN
  -- amount_total: Monto total a pagar (incluye mensualidad + transporte)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'amount_total'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN amount_total numeric(10,2) NULL;
    RAISE NOTICE '✅ Columna amount_total agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna amount_total ya existe';
  END IF;

  -- amount_monthly: Monto mensual base (sin transporte)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'amount_monthly'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN amount_monthly numeric(10,2) NULL;
    RAISE NOTICE '✅ Columna amount_monthly agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna amount_monthly ya existe';
  END IF;

  -- invoice_number: Número de factura (opcional pero útil)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN invoice_number text NULL;
    RAISE NOTICE '✅ Columna invoice_number agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna invoice_number ya existe';
  END IF;

  -- due_date: Fecha de vencimiento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN due_date date NULL;
    RAISE NOTICE '✅ Columna due_date agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna due_date ya existe';
  END IF;

  -- internal_token: Token interno para identificar reservas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'internal_token'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN internal_token text NULL;
    RAISE NOTICE '✅ Columna internal_token agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna internal_token ya existe';
  END IF;

END $$;

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_bookings_internal_token ON public.bookings(internal_token);

-- 4. Comentarios para documentación
COMMENT ON COLUMN public.bookings.amount_total IS 'Monto total a pagar (mensualidad + transporte)';
COMMENT ON COLUMN public.bookings.amount_monthly IS 'Monto mensual base (solo almacenamiento)';
COMMENT ON COLUMN public.bookings.invoice_number IS 'Número de factura generado';
COMMENT ON COLUMN public.bookings.due_date IS 'Fecha límite de pago';
COMMENT ON COLUMN public.bookings.internal_token IS 'Token único interno para identificar la reserva';

-- 5. Verificar columnas después de ejecutar
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN (
    'amount_total', 
    'amount_monthly', 
    'invoice_number',
    'due_date',
    'internal_token'
  )
ORDER BY column_name;

-- 6. Mostrar estructura completa de la tabla (opcional)
/*
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;
*/
