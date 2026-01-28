import CryptoJS from 'crypto-js';
import WOMPI_CONFIG from '../config/wompi';

/**
 * Genera la firma de integridad para transacciones de Wompi
 * Requerida en producción para validar la autenticidad de las transacciones
 * 
 * @param {string} reference - Referencia única de la transacción
 * @param {number} amountInCents - Monto en centavos
 * @param {string} currency - Moneda (default: COP)
 * @returns {string} Firma de integridad en formato hexadecimal
 */
export function generateWompiIntegrity(reference, amountInCents, currency = 'COP') {
  const integritySecret = WOMPI_CONFIG.integritySecret;
  
  if (!integritySecret) {
    console.warn('⚠️ WOMPI: Integrity Secret no configurado. Requerido para producción.');
    return '';
  }

  // Concatenar los valores en el orden correcto
  const concatenatedString = `${reference}${amountInCents}${currency}${integritySecret}`;
  
  // Generar hash SHA256
  const hash = CryptoJS.SHA256(concatenatedString);
  
  // Convertir a hexadecimal
  const integrity = hash.toString(CryptoJS.enc.Hex);
  
  console.log('🔐 Firma de integridad generada:', {
    reference,
    amountInCents,
    currency,
    integrity: integrity.substring(0, 16) + '...' // Mostrar solo los primeros caracteres
  });
  
  return integrity;
}

/**
 * Valida si una transacción tiene los datos necesarios para Wompi
 */
export function validateWompiData(data) {
  const errors = [];
  
  if (!data.reference) errors.push('Falta reference');
  if (!data.amountInCents || data.amountInCents <= 0) errors.push('Monto inválido');
  if (!data.currency) errors.push('Falta currency');
  
  if (WOMPI_CONFIG.isProduction && !WOMPI_CONFIG.integritySecret) {
    errors.push('Integrity Secret no configurado (requerido en producción)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
