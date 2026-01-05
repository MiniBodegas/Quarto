/**
 * Servicio de integración con Alegra API
 * Gestiona la creación de facturas electrónicas en el sistema de facturación Alegra
 */

const ALEGRA_API_URL = import.meta.env.VITE_ALEGRA_API_URL || 'https://api.alegra.com/api/v1';
const ALEGRA_USERNAME = import.meta.env.VITE_ALEGRA_USERNAME;
const ALEGRA_PASSWORD = import.meta.env.VITE_ALEGRA_PASSWORD;

/**
 * Configuración de autenticación básica para Alegra
 */
const getAuthHeaders = () => {
  const credentials = btoa(`${ALEGRA_USERNAME}:${ALEGRA_PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Calcula el IVA (19% en Colombia)
 * @param {number} basePrice - Precio sin impuestos
 * @returns {number} Valor del IVA
 */
const calculateIVA = (basePrice) => {
  return basePrice * 0.19;
};

/**
 * Formatea una fecha al formato yyyy-MM-dd requerido por Alegra
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato yyyy-MM-dd
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Genera el payload de items para la factura según el formato de Alegra
 * @param {Object} bookingData - Datos de la reserva
 * @returns {Array} Array de items para la factura
 */
export const generateInvoiceItems = (bookingData) => {
  const items = [];
  
  // Item 1: Servicio de almacenamiento mensual
  if (bookingData.amount_monthly > 0) {
    const monthlyPrice = bookingData.amount_monthly;
    const monthlyTax = calculateIVA(monthlyPrice);
    
    items.push({
      id: 1, // ID del producto/servicio en Alegra (debes configurarlo en Alegra primero)
      reference: 'STORAGE-MONTHLY',
      description: `Almacenamiento ${bookingData.total_volume} m³ - Mes`,
      quantity: 1,
      price: monthlyPrice, // Precio SIN impuestos
      tax: [{
        id: 1, // ID del impuesto IVA en Alegra
        name: 'IVA',
        percentage: 19,
        amount: monthlyTax
      }]
    });
  }
  
  // Item 2: Transporte/Logística (si aplica)
  if (bookingData.transport_price > 0) {
    const transportPrice = bookingData.transport_price;
    const transportTax = calculateIVA(transportPrice);
    
    items.push({
      id: 2, // ID del producto/servicio de transporte en Alegra
      reference: 'TRANSPORT',
      description: `Transporte - ${bookingData.logistics_method || 'Servicio de logística'}`,
      quantity: 1,
      price: transportPrice, // Precio SIN impuestos
      tax: [{
        id: 1,
        name: 'IVA',
        percentage: 19,
        amount: transportTax
      }]
    });
  }
  
  // Item 3: Items individuales almacenados (detalle descriptivo)
  if (bookingData.inventory && bookingData.inventory.length > 0) {
    bookingData.inventory.forEach((item, index) => {
      items.push({
        id: 100 + index, // IDs secuenciales para items de inventario
        reference: `ITEM-${item.short_code || item.id}`,
        description: `${item.name} (${item.quantity} unidad${item.quantity > 1 ? 'es' : ''}) - ${item.volume} m³`,
        quantity: item.quantity,
        price: 0, // Items de inventario no tienen precio individual (ya incluido en monthly)
        tax: []
      });
    });
  }
  
  return items;
};

/**
 * Crea o busca un cliente en Alegra
 * @param {Object} clientData - Datos del cliente
 * @returns {Promise<Object>} Cliente creado o encontrado
 */
export const createOrGetClient = async (clientData) => {
  try {
    // 1. Buscar cliente existente por email o documento
    const searchParams = new URLSearchParams({
      email: clientData.email
    });
    
    const searchResponse = await fetch(
      `${ALEGRA_API_URL}/contacts?${searchParams}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    
    if (searchResponse.ok) {
      const clients = await searchResponse.json();
      if (clients && clients.length > 0) {
        console.log('[Alegra] Cliente existente encontrado:', clients[0]);
        return clients[0];
      }
    }
    
    // 2. Si no existe, crear nuevo cliente
    const clientPayload = {
      name: clientData.name,
      email: clientData.email,
      phonePrimary: clientData.phone,
      identification: clientData.document_number,
      identificationType: mapDocumentType(clientData.document_type),
      type: clientData.booking_type === 'company' ? 'company' : 'client',
      ...(clientData.booking_type === 'company' && {
        kindOfPerson: 'LEGAL',
        regime: 'COMMON' // Régimen común por defecto
      })
    };
    
    if (clientData.booking_type === 'company' && clientData.company_nit) {
      clientPayload.identification = clientData.company_nit;
      clientPayload.identificationType = 'NIT';
    }
    
    console.log('[Alegra] Creando nuevo cliente:', clientPayload);
    
    const createResponse = await fetch(`${ALEGRA_API_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(clientPayload)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Error creando cliente en Alegra: ${JSON.stringify(error)}`);
    }
    
    const newClient = await createResponse.json();
    console.log('[Alegra] Cliente creado exitosamente:', newClient);
    return newClient;
    
  } catch (error) {
    console.error('[Alegra] Error en createOrGetClient:', error);
    throw error;
  }
};

/**
 * Mapea los tipos de documento de Quarto a Alegra
 */
const mapDocumentType = (documentType) => {
  const map = {
    'CC': 'CC', // Cédula de Ciudadanía
    'CE': 'CE', // Cédula de Extranjería
    'PP': 'passport', // Pasaporte
    'NIT': 'NIT' // NIT para empresas
  };
  return map[documentType] || 'CC';
};

/**
 * Crea una factura en Alegra
 * @param {Object} invoiceData - Datos de la factura
 * @returns {Promise<Object>} Factura creada
 */
export const createInvoice = async (invoiceData) => {
  try {
    console.log('[Alegra] Creando factura con datos:', invoiceData);
    
    // 1. Obtener o crear cliente
    const client = await createOrGetClient(invoiceData.client);
    
    // 2. Preparar items
    const items = generateInvoiceItems(invoiceData);
    
    // 3. Calcular fechas
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30); // Vencimiento a 30 días
    
    // 4. Construir payload de factura
    const invoicePayload = {
      date: formatDate(invoiceData.date || today),
      dueDate: formatDate(invoiceData.dueDate || dueDate),
      client: {
        id: client.id // ID del cliente en Alegra
      },
      items: items,
      observations: invoiceData.observations || 
        `Reserva #${invoiceData.booking_id}\n` +
        `Volumen total: ${invoiceData.total_volume} m³\n` +
        `Items almacenados: ${invoiceData.total_items}\n` +
        `Método logístico: ${invoiceData.logistics_method || 'N/A'}`,
      termsConditions: invoiceData.termsConditions || 
        'Pago mediante plataforma Wompi. Servicio de almacenamiento mensual con renovación automática.',
      // Campos opcionales
      ...(invoiceData.numberTemplate && { numberTemplate: invoiceData.numberTemplate }),
      ...(invoiceData.seller && { seller: invoiceData.seller }),
      stamp: {
        generateStamp: true // Generar timbre electrónico
      }
    };
    
    console.log('[Alegra] Payload de factura:', JSON.stringify(invoicePayload, null, 2));
    
    // 5. Enviar a Alegra
    const response = await fetch(`${ALEGRA_API_URL}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoicePayload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[Alegra] Error de API:', error);
      throw new Error(`Error de Alegra API: ${JSON.stringify(error)}`);
    }
    
    const invoice = await response.json();
    console.log('[Alegra] ✅ Factura creada exitosamente:', invoice);
    
    return {
      success: true,
      invoice: invoice,
      invoiceNumber: invoice.numberTemplate?.fullNumber || invoice.id,
      invoiceId: invoice.id,
      pdfUrl: invoice.pdf?.url,
      status: invoice.status
    };
    
  } catch (error) {
    console.error('[Alegra] Error creando factura:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtiene una factura por ID
 * @param {string} invoiceId - ID de la factura en Alegra
 * @returns {Promise<Object>} Datos de la factura
 */
export const getInvoice = async (invoiceId) => {
  try {
    const response = await fetch(`${ALEGRA_API_URL}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo factura de Alegra');
    }
    
    const invoice = await response.json();
    return invoice;
    
  } catch (error) {
    console.error('[Alegra] Error obteniendo factura:', error);
    throw error;
  }
};

/**
 * Envía una factura por email
 * @param {string} invoiceId - ID de la factura
 * @param {Array<string>} emails - Lista de emails destinatarios
 * @returns {Promise<boolean>} Éxito del envío
 */
export const sendInvoiceByEmail = async (invoiceId, emails) => {
  try {
    const response = await fetch(`${ALEGRA_API_URL}/invoices/${invoiceId}/email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        emails: emails,
        sendCopyToUser: true // Enviar copia al usuario de Alegra
      })
    });
    
    if (!response.ok) {
      throw new Error('Error enviando factura por email');
    }
    
    console.log('[Alegra] ✅ Factura enviada por email');
    return true;
    
  } catch (error) {
    console.error('[Alegra] Error enviando email:', error);
    throw error;
  }
};

/**
 * Anula una factura
 * @param {string} invoiceId - ID de la factura
 * @param {string} reason - Razón de anulación
 * @returns {Promise<boolean>} Éxito de la anulación
 */
export const cancelInvoice = async (invoiceId, reason) => {
  try {
    const response = await fetch(`${ALEGRA_API_URL}/invoices/${invoiceId}/void`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        observations: reason || 'Anulación solicitada por el cliente'
      })
    });
    
    if (!response.ok) {
      throw new Error('Error anulando factura');
    }
    
    console.log('[Alegra] ✅ Factura anulada');
    return true;
    
  } catch (error) {
    console.error('[Alegra] Error anulando factura:', error);
    throw error;
  }
};

/**
 * Registra un pago para una factura
 * @param {string} invoiceId - ID de la factura
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<Object>} Pago registrado
 */
export const registerPayment = async (invoiceId, paymentData) => {
  try {
    const paymentPayload = {
      date: formatDate(paymentData.date || new Date()),
      amount: paymentData.amount,
      paymentMethod: paymentData.method || 'online', // online, cash, credit, etc
      bankAccount: paymentData.bankAccount, // Opcional
      observations: paymentData.observations || 
        `Pago Wompi - Transacción: ${paymentData.wompi_transaction_id || 'N/A'}`,
      invoices: [{
        id: invoiceId,
        amount: paymentData.amount
      }]
    };
    
    console.log('[Alegra] Registrando pago:', paymentPayload);
    
    const response = await fetch(`${ALEGRA_API_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentPayload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error registrando pago: ${JSON.stringify(error)}`);
    }
    
    const payment = await response.json();
    console.log('[Alegra] ✅ Pago registrado:', payment);
    return payment;
    
  } catch (error) {
    console.error('[Alegra] Error registrando pago:', error);
    throw error;
  }
};

/**
 * Valida la conexión con Alegra
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${ALEGRA_API_URL}/company`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const company = await response.json();
      console.log('[Alegra] ✅ Conexión exitosa. Empresa:', company.name);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('[Alegra] Error de conexión:', error);
    return false;
  }
};

export default {
  createInvoice,
  getInvoice,
  sendInvoiceByEmail,
  cancelInvoice,
  registerPayment,
  createOrGetClient,
  generateInvoiceItems,
  testConnection
};
