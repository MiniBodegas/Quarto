-- ============================================
-- SOLUCIÓN TEMPORAL: DESHABILITAR RLS
-- ============================================
-- ⚠️ USAR SOLO TEMPORALMENTE PARA TESTING
-- Esto deshabilitará RLS en la tabla users para que funcione el booking

-- OPCIÓN A: Deshabilitar RLS completamente (NO RECOMENDADO EN PRODUCCIÓN)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verifica que RLS esté deshabilitado:
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Resultado esperado:
-- rowsecurity = false (RLS deshabilitado)
