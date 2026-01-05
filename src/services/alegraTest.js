/**
 * Script de prueba para la integración de Alegra
 * Ejecutar en la consola del navegador o crear un componente temporal
 */

import { useAlegra } from '../hooks/useAlegra';

// Datos de prueba para crear una factura
const testBookingData = {
  id: 'test-booking-123',
  name: 'Juan Pérez',
  email: 'juan.perez@example.com',
  phone: '3001234567',
  document_type: 'CC',
  document_number: '12345678',
  booking_type: 'person',
  amount_monthly: 80900, // 1 m³
  transport_price: 100000,
  total_volume: 1,
  total_items: 10,
  logistics_method: 'Recogida',
  inventory: [
    {
      id: '1',
      name: 'Silla',
      quantity: 4,
      volume: 0.15,
      short_code: 'ABC123'
    },
    {
      id: '2',
      name: 'Mesa',
      quantity: 1,
      volume: 0.4,
      short_code: 'DEF456'
    }
  ]
};

// Función de prueba
export const testAlegraIntegration = async () => {
  console.group('🧪 Test Alegra Integration');
  
  try {
    // 1. Test de creación de factura
    console.log('1️⃣ Probando creación de factura...');
    
    const response = await fetch('http://localhost:3000/api/alegra/create-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: testBookingData.id,
        clientData: {
          name: testBookingData.name,
          email: testBookingData.email,
          phone: testBookingData.phone,
          document_type: testBookingData.document_type,
          document_number: testBookingData.document_number,
          booking_type: testBookingData.booking_type
        },
        invoiceData: {
          amount_monthly: testBookingData.amount_monthly,
          transport_price: testBookingData.transport_price,
          total_volume: testBookingData.total_volume,
          total_items: testBookingData.total_items,
          logistics_method: testBookingData.logistics_method,
          inventory: testBookingData.inventory
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error, null, 2));
    }

    const result = await response.json();
    
    console.log('✅ Factura creada exitosamente:');
    console.table({
      'Invoice ID': result.invoice.id,
      'Número': result.invoice.number,
      'Total': result.invoice.total,
      'Estado': result.invoice.status,
      'PDF': result.invoice.pdfUrl
    });

    // 2. Test de registro de pago (simulado)
    if (result.success && result.invoice.id) {
      console.log('\n2️⃣ Probando registro de pago...');
      
      const paymentResponse = await fetch('http://localhost:3000/api/alegra/register-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: result.invoice.id,
          amount: result.invoice.total,
          transactionId: 'WOMPI-TEST-' + Date.now(),
          paymentDate: new Date().toISOString()
        })
      });

      if (!paymentResponse.ok) {
        const paymentError = await paymentResponse.json();
        throw new Error(JSON.stringify(paymentError, null, 2));
      }

      const paymentResult = await paymentResponse.json();
      
      console.log('✅ Pago registrado exitosamente:');
      console.table({
        'Payment ID': paymentResult.payment.id,
        'Fecha': paymentResult.payment.date,
        'Monto': paymentResult.payment.amount,
        'Estado': paymentResult.payment.status
      });
    }

    console.log('\n✅ Todos los tests pasaron correctamente');
    console.groupEnd();
    
    return {
      success: true,
      invoice: result.invoice
    };
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    console.groupEnd();
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Datos de prueba para empresa
export const testCompanyBookingData = {
  id: 'test-company-booking-456',
  booking_type: 'company',
  company_name: 'Empresa Test SAS',
  company_nit: '900123456-1',
  name: 'María González',
  email: 'maria@empresatest.com',
  phone: '3109876543',
  document_type: 'CC',
  document_number: '87654321',
  amount_monthly: 276000, // 5 m³
  transport_price: 140000,
  total_volume: 5,
  total_items: 45,
  logistics_method: 'Recogida',
  inventory: [
    {
      id: '1',
      name: 'Escritorio ejecutivo',
      quantity: 5,
      volume: 0.8,
      short_code: 'ESC001'
    },
    {
      id: '2',
      name: 'Silla oficina',
      quantity: 20,
      volume: 0.15,
      short_code: 'SIL001'
    },
    {
      id: '3',
      name: 'Archivador',
      quantity: 10,
      volume: 0.5,
      short_code: 'ARC001'
    }
  ]
};

// Test para empresa
export const testCompanyInvoice = async () => {
  console.group('🏢 Test Alegra - Factura Empresa');
  
  try {
    const response = await fetch('http://localhost:3000/api/alegra/create-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: testCompanyBookingData.id,
        clientData: {
          name: testCompanyBookingData.name,
          email: testCompanyBookingData.email,
          phone: testCompanyBookingData.phone,
          document_type: testCompanyBookingData.document_type,
          document_number: testCompanyBookingData.document_number,
          booking_type: testCompanyBookingData.booking_type,
          company_name: testCompanyBookingData.company_name,
          company_nit: testCompanyBookingData.company_nit
        },
        invoiceData: {
          amount_monthly: testCompanyBookingData.amount_monthly,
          transport_price: testCompanyBookingData.transport_price,
          total_volume: testCompanyBookingData.total_volume,
          total_items: testCompanyBookingData.total_items,
          logistics_method: testCompanyBookingData.logistics_method,
          inventory: testCompanyBookingData.inventory
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Factura de empresa creada:');
      console.table({
        'Invoice ID': result.invoice.id,
        'Número': result.invoice.number,
        'Cliente': testCompanyBookingData.company_name,
        'NIT': testCompanyBookingData.company_nit,
        'Total': result.invoice.total
      });
    } else {
      console.error('❌ Error:', result.error);
    }
    
    console.groupEnd();
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

// Verificar configuración
export const checkAlegraConfig = async () => {
  console.group('🔍 Verificar Configuración Alegra');
  
  try {
    const response = await fetch('http://localhost:3000/api/alegra/test-connection');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión exitosa con Alegra');
      console.table(data);
    } else {
      console.error('❌ No se pudo conectar con Alegra');
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    console.groupEnd();
  }
};

// Exportar para uso en componentes React
export default {
  testAlegraIntegration,
  testCompanyInvoice,
  checkAlegraConfig,
  testBookingData,
  testCompanyBookingData
};
