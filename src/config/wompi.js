/**
 * Configuración de Wompi
 * Maneja automáticamente el cambio entre ambiente de pruebas y producción
 */

// Determinar el modo actual
const mode = import.meta.env.VITE_WOMPI_MODE || 'development';
const isProduction = mode === 'production';

// Seleccionar las claves según el modo
export const WOMPI_CONFIG = {
  mode: mode,
  isProduction: isProduction,
  
  // Public Key (se usa en el frontend)
  publicKey: isProduction
    ? import.meta.env.VITE_WOMPI_PUBLIC_KEY_PROD
    : import.meta.env.VITE_WOMPI_PUBLIC_KEY_TEST,
  
  // Private Key (solo para backend, NO exponer en frontend)
  privateKey: isProduction
    ? import.meta.env.VITE_WOMPI_PRIVATE_KEY_PROD
    : import.meta.env.VITE_WOMPI_PRIVATE_KEY_TEST,
  
  // Secret de integridad
  integritySecret: import.meta.env.VITE_WOMPI_INTEGRITY_SECRET || '',
  
  // URLs de la API de Wompi
  apiUrl: isProduction
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1',
  
  // URL del widget de checkout
  checkoutUrl: 'https://checkout.wompi.co/widget.js',
};

// Validar configuración
if (!WOMPI_CONFIG.publicKey) {
  console.error('⚠️ WOMPI: Public Key no configurada para el modo:', mode);
}

// Log de ambiente (solo en desarrollo)
if (!isProduction) {
  console.log('🔧 WOMPI Config:', {
    mode: WOMPI_CONFIG.mode,
    isProduction: WOMPI_CONFIG.isProduction,
    publicKey: WOMPI_CONFIG.publicKey ? '✅ Configurada' : '❌ Falta',
    hasIntegritySecret: !!WOMPI_CONFIG.integritySecret,
  });
}

export default WOMPI_CONFIG;
