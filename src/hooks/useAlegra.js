/**
 * Hook para gestionar la integración con Alegra
 * Maneja la creación de facturas y registro de pagos
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAlegra = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Crea una factura en Alegra para un booking
   * @param {string} bookingId - ID del booking en Supabase
   * @param {Object} bookingData - Datos completos del booking
   * @returns {Promise<Object>} Datos de la factura creada
   */
  const createInvoice = useCallback(async (bookingId, bookingData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useAlegra] Creando factura para booking:', bookingId);

      // Preparar datos del cliente
      const clientData = {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        document_type: bookingData.document_type,
        document_number: bookingData.document_number,
        booking_type: bookingData.booking_type,
        company_name: bookingData.company_name,
        company_nit: bookingData.company_nit
      };

      // Preparar datos de la factura
      const invoiceData = {
        amount_monthly: bookingData.amount_monthly,
        transport_price: bookingData.transport_price || 0,
        total_volume: bookingData.total_volume,
        total_items: bookingData.total_items,
        logistics_method: bookingData.logistics_method,
        inventory: bookingData.inventory || []
      };

      const response = await fetch(`${API_URL}/api/alegra/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          clientData,
          invoiceData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando factura');
      }

      const result = await response.json();
      console.log('[useAlegra] ✅ Factura creada:', result.invoice);

      return {
        success: true,
        invoice: result.invoice
      };

    } catch (err) {
      console.error('[useAlegra] Error:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un pago en Alegra después de confirmación de Wompi
   * @param {string} alegraInvoiceId - ID de la factura en Alegra
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Confirmación del pago registrado
   */
  const registerPayment = useCallback(async (alegraInvoiceId, paymentData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useAlegra] Registrando pago para factura:', alegraInvoiceId);

      const response = await fetch(`${API_URL}/api/alegra/register-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: alegraInvoiceId,
          amount: paymentData.amount,
          transactionId: paymentData.wompi_transaction_id,
          paymentDate: paymentData.date || new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error registrando pago');
      }

      const result = await response.json();
      console.log('[useAlegra] ✅ Pago registrado:', result.payment);

      return {
        success: true,
        payment: result.payment
      };

    } catch (err) {
      console.error('[useAlegra] Error registrando pago:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crea factura automáticamente al confirmar un booking
   * @param {Object} bookingData - Datos completos del booking
   * @returns {Promise<Object>} Resultado de la operación
   */
  const createInvoiceOnBooking = useCallback(async (bookingData) => {
    if (!bookingData?.id) {
      return {
        success: false,
        error: 'Booking ID no proporcionado'
      };
    }

    console.log('[useAlegra] Creando factura automática para booking:', bookingData.id);
    return await createInvoice(bookingData.id, bookingData);
  }, [createInvoice]);

  /**
   * Registra pago automáticamente después de webhook de Wompi
   * @param {string} bookingId - ID del booking
   * @param {string} alegraInvoiceId - ID de factura en Alegra
   * @param {Object} wompiData - Datos de transacción Wompi
   * @returns {Promise<Object>} Resultado del registro
   */
  const registerPaymentOnWompiSuccess = useCallback(async (
    bookingId,
    alegraInvoiceId,
    wompiData
  ) => {
    if (!alegraInvoiceId) {
      console.warn('[useAlegra] No hay factura de Alegra para registrar pago');
      return {
        success: false,
        error: 'No se encontró factura de Alegra'
      };
    }

    const paymentData = {
      amount: wompiData.amount_in_cents / 100, // Convertir centavos a pesos
      wompi_transaction_id: wompiData.transaction_id,
      date: wompiData.finalized_at || new Date().toISOString()
    };

    console.log('[useAlegra] Registrando pago automático:', paymentData);
    return await registerPayment(alegraInvoiceId, paymentData);
  }, [registerPayment]);

  return {
    loading,
    error,
    createInvoice,
    registerPayment,
    createInvoiceOnBooking,
    registerPaymentOnWompiSuccess
  };
};

export default useAlegra;
