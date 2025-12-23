/**
 * Script de verificación para la tabla invoices
 * Ejecutar en la consola del navegador o en un componente temporal
 */

import { supabase } from '../supabase';

export const verifyInvoicesTable = async () => {
  console.log('[Verify] 🔍 Verificando tabla invoices...');
  
  try {
    // 1. Intentar leer la estructura
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('[Verify] ❌ Error accediendo a tabla invoices:', error);
      console.error('[Verify] Código:', error.code);
      console.error('[Verify] Mensaje:', error.message);
      console.error('[Verify] Detalles:', error.details);
      return { success: false, error };
    }
    
    console.log('[Verify] ✅ Tabla invoices accesible');
    console.log('[Verify] Estructura de ejemplo:', data);
    
    // 2. Verificar si podemos insertar
    const testInvoice = {
      user_id: 'test-user-id',
      booking_id: 'test-booking-id',
      invoice_number: `TEST-${Date.now()}`,
      amount: 100,
      status: 'PENDING',
      description: 'Test invoice',
      created_at: new Date().toISOString(),
      due_date: new Date().toISOString(),
    };
    
    console.log('[Verify] 📝 Intentando insertar factura de prueba...');
    const { data: insertData, error: insertError } = await supabase
      .from('invoices')
      .insert([testInvoice])
      .select();
    
    if (insertError) {
      console.error('[Verify] ❌ Error insertando en invoices:', insertError);
      console.error('[Verify] Código:', insertError.code);
      console.error('[Verify] Mensaje:', insertError.message);
      console.error('[Verify] Detalles:', insertError.details);
      
      if (insertError.code === '42P01') {
        console.error('[Verify] 💡 La tabla NO EXISTE');
      } else if (insertError.code === '42501') {
        console.error('[Verify] 💡 Problema de PERMISOS RLS');
      } else if (insertError.code === '23505') {
        console.error('[Verify] 💡 Violación de UNIQUE constraint');
      } else if (insertError.code === '23503') {
        console.error('[Verify] 💡 Violación de FOREIGN KEY');
      }
      
      return { success: false, insertError };
    }
    
    console.log('[Verify] ✅ Inserción exitosa:', insertData);
    
    // 3. Limpiar - eliminar el test
    if (insertData && insertData[0]?.id) {
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.warn('[Verify] ⚠️ No se pudo eliminar la factura de prueba:', deleteError);
      } else {
        console.log('[Verify] 🧹 Factura de prueba eliminada');
      }
    }
    
    return { success: true, data: insertData };
    
  } catch (error) {
    console.error('[Verify] ❌ Error inesperado:', error);
    return { success: false, error };
  }
};

// Para ejecutar desde la consola del navegador:
// import { verifyInvoicesTable } from './utils/verifyInvoicesTable';
// verifyInvoicesTable();
