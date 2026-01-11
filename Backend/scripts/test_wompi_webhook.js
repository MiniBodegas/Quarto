/**
 * Test script for Wompi webhook
 * Simulates a payment notification from Wompi
 * 
 * Usage:
 * 1. First, create a booking to get a valid booking_id
 * 2. Run: node test_wompi_webhook.js <booking_id>
 */

const https = require('https');
require('dotenv').config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://quarto-backend.com/api/wompi/webhook';
const bookingId = process.argv[2];

if (!bookingId) {
  console.error('❌ Usage: node test_wompi_webhook.js <booking_id>');
  process.exit(1);
}

// Simular una referencia Wompi válida
const wompiReference = `QUARTO_${bookingId}_1234567890`;
const transactionId = `evt_${Date.now()}`;

const payload = {
  event: 'transaction.updated',
  data: {
    transaction: {
      id: transactionId,
      reference: wompiReference,
      status: 'APPROVED',
      amount_in_cents: 50000, // $500 COP
      currency: 'COP',
      payment_method_type: 'CARD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  }
};

console.log('📤 Enviando webhook de prueba...');
console.log('Payload:', JSON.stringify(payload, null, 2));

const options = {
  hostname: new URL(WEBHOOK_URL).hostname,
  port: 443,
  path: '/api/wompi/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(payload).length
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Response:', res.statusCode);
    console.log('Response body:', data);

    if (res.statusCode === 200) {
      console.log('✅ Webhook recibido correctamente');
      console.log('\n📋 Datos enviados:');
      console.log(`  - Booking ID: ${bookingId}`);
      console.log(`  - Reference: ${wompiReference}`);
      console.log(`  - Transaction ID: ${transactionId}`);
      console.log(`  - Status: APPROVED`);
      console.log('\n✅ Ahora verifica en la BD que el booking y la tabla payments fueron actualizados');
    } else {
      console.error('❌ Error en el webhook');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

req.write(JSON.stringify(payload));
req.end();
