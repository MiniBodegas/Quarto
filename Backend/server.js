// server.js (o index.js)
import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// ✅ Cliente Supabase (Service Role SOLO en backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const port = process.env.PORT || 3000;

/**
 * ✅ CORS robusto:
 * - Permite local (vite)
 * - Permite producción (Vercel) vía FRONTEND_URL
 * - Permite requests sin Origin (curl/postman/webhooks)
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // ej: https://tu-app.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Permitir requests sin origin (curl, postman, webhooks server-to-server)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("*", cors());

app.use(express.json({ limit: "1mb" }));

// ✅ Health checks
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/wompi/ping", (req, res) => res.json({ ok: true, hasWebhook: true }));

/**
 * ✅ Endpoint para firma integrity
 * Body:
 * {
 *   reference: string,
 *   amountInCents: int,
 *   currency: "COP",
 *   publicKey: "pub_test_..." | "pub_prod_..."
 * }
 */
app.post("/api/wompi/integrity", (req, res) => {
  try {
    const { reference, amountInCents, currency = "COP", publicKey } = req.body || {};

    if (!reference || !Number.isInteger(amountInCents) || !currency || !publicKey) {
      return res.status(400).json({ error: "Datos inválidos", received: req.body });
    }

    const isTest = String(publicKey).startsWith("pub_test_");

    const integritySecret = isTest
      ? process.env.WOMPI_INTEGRITY_SECRET_TEST
      : process.env.WOMPI_INTEGRITY_SECRET_PROD;

    if (!integritySecret) {
      return res.status(500).json({
        error: "Integrity secret no configurado para este ambiente",
        hint: isTest ? "Falta WOMPI_INTEGRITY_SECRET_TEST" : "Falta WOMPI_INTEGRITY_SECRET_PROD",
      });
    }

    // ✅ FORMATO OFICIAL WOMPI: "<Reference><Amount><Currency><IntegritySecret>"
    const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signatureIntegrity = crypto.createHash("sha256").update(raw).digest("hex");

    return res.json({ signatureIntegrity });
  } catch (err) {
    console.error("[WOMPI] integrity ERROR:", err);
    return res.status(500).json({ error: "Error generando firma" });
  }
});

/**
 * 🔧 Función auxiliar para crear factura en Alegra
 * Usada tanto por el endpoint POST como por el webhook de Wompi
 */
async function createAlegraInvoice(bookingId, clientData, invoiceData) {
  const ALEGRA_API_URL = process.env.ALEGRA_API_URL || 'https://api.alegra.com/api/v1';
  const ALEGRA_USERNAME = process.env.ALEGRA_USERNAME;
  const ALEGRA_PASSWORD = process.env.ALEGRA_PASSWORD;

  if (!ALEGRA_USERNAME || !ALEGRA_PASSWORD) {
    return { 
      success: false, 
      error: "Credenciales de Alegra no configuradas" 
    };
  }

  const authHeader = Buffer.from(`${ALEGRA_USERNAME}:${ALEGRA_PASSWORD}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${authHeader}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // 1️⃣ Crear o buscar cliente en Alegra
    let alegraClient = null;
    
    const searchResponse = await fetch(
      `${ALEGRA_API_URL}/contacts?email=${encodeURIComponent(clientData.email)}`,
      { method: 'GET', headers }
    );

    if (searchResponse.ok) {
      const clients = await searchResponse.json();
      if (clients && clients.length > 0) {
        alegraClient = clients[0];
        console.log("[ALEGRA] Cliente existente:", alegraClient.id);
      }
    }

    if (!alegraClient) {
      const docTypeMap = { 'CC': 'CC', 'CE': 'CE', 'PP': 'passport', 'NIT': 'NIT' };

      const clientPayload = {
        name: clientData.booking_type === 'company' ? clientData.company_name : clientData.name,
        email: clientData.email,
        phonePrimary: clientData.phone,
        identification: clientData.booking_type === 'company' ? clientData.company_nit : clientData.document_number,
        identificationType: clientData.booking_type === 'company' ? 'NIT' : docTypeMap[clientData.document_type] || 'CC',
        type: clientData.booking_type === 'company' ? 'company' : 'client'
      };

      const createResponse = await fetch(`${ALEGRA_API_URL}/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(clientPayload)
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Error creando cliente: ${JSON.stringify(error)}`);
      }

      alegraClient = await createResponse.json();
      console.log("[ALEGRA] Cliente creado:", alegraClient.id);
    }

    // 2️⃣ Generar items de la factura
    const items = [];
    
    if (invoiceData.amount_monthly > 0) {
      const monthlyPrice = invoiceData.amount_monthly;
      const ivaAmount = monthlyPrice * 0.19;

      items.push({
        id: parseInt(process.env.ALEGRA_PRODUCT_STORAGE_ID || '1'),
        reference: 'STORAGE-MONTHLY',
        description: `Almacenamiento ${invoiceData.total_volume} m³ - Mensual`,
        quantity: 1,
        price: monthlyPrice,
        tax: [{
          id: parseInt(process.env.ALEGRA_TAX_IVA_ID || '1'),
          name: 'IVA',
          percentage: 19,
          amount: ivaAmount
        }]
      });
    }

    if (invoiceData.transport_price > 0) {
      const transportPrice = invoiceData.transport_price;
      const ivaAmount = transportPrice * 0.19;

      items.push({
        id: parseInt(process.env.ALEGRA_PRODUCT_TRANSPORT_ID || '2'),
        reference: 'TRANSPORT',
        description: `Transporte - ${invoiceData.logistics_method}`,
        quantity: 1,
        price: transportPrice,
        tax: [{
          id: parseInt(process.env.ALEGRA_TAX_IVA_ID || '1'),
          name: 'IVA',
          percentage: 19,
          amount: ivaAmount
        }]
      });
    }

    // 3️⃣ Crear factura
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const invoicePayload = {
      date: formatDate(today),
      dueDate: formatDate(dueDate),
      client: { id: alegraClient.id },
      items: items,
      observations: `Reserva #${bookingId}\nVolumen: ${invoiceData.total_volume} m³\nItems: ${invoiceData.total_items}\nLogística: ${invoiceData.logistics_method || 'N/A'}`,
      termsConditions: 'Pago mediante Wompi. Servicio mensual con renovación automática.',
      stamp: { generateStamp: true }
    };

    console.log("[ALEGRA] Creando factura:", JSON.stringify(invoicePayload, null, 2));

    const invoiceResponse = await fetch(`${ALEGRA_API_URL}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invoicePayload)
    });

    if (!invoiceResponse.ok) {
      const error = await invoiceResponse.json();
      console.error("[ALEGRA] Error API:", error);
      throw new Error(`Error de Alegra: ${JSON.stringify(error)}`);
    }

    const invoice = await invoiceResponse.json();
    console.log("[ALEGRA] ✅ Factura creada:", invoice.id);

    // 4️⃣ Actualizar booking con referencia de factura
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        alegra_invoice_id: invoice.id,
        alegra_invoice_number: invoice.numberTemplate?.fullNumber || invoice.id,
        alegra_invoice_pdf: invoice.pdf?.url || null
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[ALEGRA] Error actualizando booking:", updateError);
    }

    return {
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.numberTemplate?.fullNumber || invoice.id,
        pdfUrl: invoice.pdf?.url,
        status: invoice.status,
        total: invoice.total,
        balance: invoice.balance
      }
    };

  } catch (error) {
    console.error("[ALEGRA] Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ✅ Webhook: recibe eventos de Wompi (transaction.updated)
 * Importante:
 * - Wompi pega server-to-server (sin Origin) → CORS no lo bloquea
 */
app.post("/api/wompi/webhook", async (req, res) => {
  try {
    console.log("[WOMPI WEBHOOK] Evento recibido:", JSON.stringify(req.body, null, 2));

    const { event, data } = req.body || {};
    if (!event || !data?.transaction) {
      return res.status(200).json({ received: true, warning: "payload_invalido" });
    }

    if (event !== "transaction.updated") {
      return res.status(200).json({ received: true, message: "Evento no procesado" });
    }

    const tx = data.transaction;

    const transactionId = tx.id;
    const reference = tx.reference;
    const status = tx.status;
    const amount_in_cents = tx.amount_in_cents;
    const currency = tx.currency;
    const payment_method_type = tx.payment_method_type;

    console.log("[WOMPI] Transaction Update:");
    console.log("  - ID:", transactionId);
    console.log("  - Reference:", reference);
    console.log("  - Status:", status);
    console.log("  - Amount:", amount_in_cents, currency);
    console.log("  - Payment Method:", payment_method_type);

    // 1️⃣ Buscar booking por wompi_reference
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("wompi_reference", reference)
      .maybeSingle();

    if (bookingError) {
      console.error("[WOMPI WEBHOOK] Error buscando booking:", bookingError);
      return res.status(200).json({ received: true, warning: "db_error_booking_lookup" });
    }

    // Si no existe booking, igual respondemos 200 para que Wompi no lo marque como fallido
    if (!booking) {
      console.warn("[WOMPI WEBHOOK] No booking con referencia:", reference);
      return res.status(200).json({ received: true, warning: "booking_not_found" });
    }

    const bookingId = booking.id;

    // 2️⃣ Actualizar booking con estado del pago
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: status,
        wompi_transaction_id: transactionId,
        paid_at: status === "APPROVED" ? new Date().toISOString() : null,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[WOMPI WEBHOOK] Error actualizando booking:", updateError);
      return res.status(200).json({ received: true, warning: "db_error_booking_update" });
    }

    // 3️⃣ Insert/Upsert en payments (idempotente)
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert(
        {
          booking_id: bookingId,
          wompi_transaction_id: transactionId,
          wompi_reference: reference,
          status,
          amount_in_cents,
          currency,
          payment_method: payment_method_type,
          wompi_event: req.body, // guarda el evento completo (si tu columna es JSONB)
        },
        { onConflict: "wompi_transaction_id" }
      );

    if (paymentError) {
      console.error("[WOMPI WEBHOOK] Error guardando payment:", paymentError);
      return res.status(200).json({ received: true, warning: "db_error_payment_upsert" });
    }

    console.log("[WOMPI WEBHOOK] OK booking:", bookingId, "→", status);

    // 4️⃣ Si el pago fue APROBADO, crear factura en Alegra automáticamente
    if (status === "APPROVED") {
      console.log("[WOMPI WEBHOOK] 💰 Pago aprobado, generando factura en Alegra...");
      
      try {
        // Obtener datos completos del booking e inventario
        const { data: fullBooking, error: bookingDetailsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingDetailsError || !fullBooking) {
          console.error("[WOMPI WEBHOOK] No se pudo obtener booking completo:", bookingDetailsError);
        } else {
          // Obtener inventario asociado
          const { data: inventoryData } = await supabase
            .from("inventory")
            .select("*")
            .eq("booking_id", bookingId);

          // Verificar si ya existe factura para este booking
          if (fullBooking.alegra_invoice_id) {
            console.log("[WOMPI WEBHOOK] ⚠️ Ya existe factura para este booking:", fullBooking.alegra_invoice_id);
          } else {
            // Preparar datos para Alegra
            const clientData = {
              name: fullBooking.name,
              email: fullBooking.email,
              phone: fullBooking.phone,
              document_type: fullBooking.document_type,
              document_number: fullBooking.document_number,
              booking_type: fullBooking.booking_type,
              company_name: fullBooking.company_name,
              company_nit: fullBooking.company_nit
            };

            const invoiceData = {
              amount_monthly: fullBooking.amount_monthly,
              transport_price: fullBooking.transport_price || 0,
              total_volume: fullBooking.total_volume,
              total_items: fullBooking.total_items,
              logistics_method: fullBooking.logistics_method,
              inventory: inventoryData || []
            };

            // Crear factura (llamada interna al mismo servidor)
            const alegraResponse = await createAlegraInvoice(bookingId, clientData, invoiceData);
            
            if (alegraResponse.success) {
              console.log("[WOMPI WEBHOOK] ✅ Factura creada en Alegra:", alegraResponse.invoice.number);
            } else {
              console.error("[WOMPI WEBHOOK] ❌ Error creando factura en Alegra:", alegraResponse.error);
            }
          }
        }
      } catch (alegraError) {
        console.error("[WOMPI WEBHOOK] Error en proceso de facturación:", alegraError);
        // No fallar el webhook por error de Alegra
      }
    }

    return res.status(200).json({ received: true, bookingId, status });
  } catch (err) {
    console.error("[WOMPI WEBHOOK] Error:", err);
    // Aún así 200 para evitar reintentos infinitos por errores momentáneos
    return res.status(200).json({ received: true, warning: "webhook_exception" });
  }
});

/**
 * ✅ Endpoint para crear factura en Alegra
 * Body:
 * {
 *   bookingId: string,
 *   clientData: { name, email, phone, document_type, document_number, booking_type, company_nit },
 *   invoiceData: { amount_monthly, transport_price, total_volume, total_items, logistics_method, inventory }
 * }
 */
app.post("/api/alegra/create-invoice", async (req, res) => {
  try {
    console.log("[ALEGRA] Solicitud de creación de factura:", req.body);

    const { bookingId, clientData, invoiceData } = req.body || {};

    if (!bookingId || !clientData || !invoiceData) {
      return res.status(400).json({ 
        error: "Datos incompletos", 
        required: ["bookingId", "clientData", "invoiceData"] 
      });
    }

    // Usar la función auxiliar
    const result = await createAlegraInvoice(bookingId, clientData, invoiceData);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error("[ALEGRA] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ✅ Endpoint para registrar pago en Alegra después de Wompi
 * Body:
 * {
 *   invoiceId: string (Alegra),
 *   amount: number,
 *   transactionId: string (Wompi),
 *   paymentDate: string
 * }
 */
app.post("/api/alegra/register-payment", async (req, res) => {
  try {
    console.log("[ALEGRA] Registrando pago:", req.body);

    const { invoiceId, amount, transactionId, paymentDate } = req.body || {};

    if (!invoiceId || !amount) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        required: ["invoiceId", "amount"]
      });
    }

    const ALEGRA_API_URL = process.env.ALEGRA_API_URL || 'https://api.alegra.com/api/v1';
    const ALEGRA_USERNAME = process.env.ALEGRA_USERNAME;
    const ALEGRA_PASSWORD = process.env.ALEGRA_PASSWORD;

    const authHeader = Buffer.from(`${ALEGRA_USERNAME}:${ALEGRA_PASSWORD}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json'
    };

    const formatDate = (date) => {
      const d = date ? new Date(date) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const paymentPayload = {
      date: formatDate(paymentDate),
      amount: amount,
      paymentMethod: 'online',
      observations: `Pago Wompi - ID: ${transactionId || 'N/A'}`,
      invoices: [{
        id: invoiceId,
        amount: amount
      }]
    };

    console.log("[ALEGRA] Payload de pago:", paymentPayload);

    const response = await fetch(`${ALEGRA_API_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error registrando pago: ${JSON.stringify(error)}`);
    }

    const payment = await response.json();
    console.log("[ALEGRA] ✅ Pago registrado:", payment.id);

    return res.json({
      success: true,
      payment: {
        id: payment.id,
        date: payment.date,
        amount: payment.amount,
        status: payment.status
      }
    });

  } catch (error) {
    console.error("[ALEGRA] Error registrando pago:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para generación mensual de facturas (genera registros en payments como PENDING)
 * - Recorre bookings con amount_monthly > 0
 * - Si no existe un payment creado en los últimos 30 días para ese booking, crea uno como PENDING
 * - Monto calculado: booking.amount_monthly || sum(inventory item price*qty) || total_volume * DEFAULT_PRICE_PER_M3
 */
app.post("/api/invoices/generate-monthly", async (req, res) => {
  try {
    console.log('[INVOICES] Generación mensual solicitada');

    // Seguridad: si se definió la variable INVOICE_JOB_TOKEN, exigir header x-invoice-job-token
    const jobToken = req.get('x-invoice-job-token');
    if (process.env.INVOICE_JOB_TOKEN) {
      if (!jobToken || jobToken !== process.env.INVOICE_JOB_TOKEN) {
        console.warn('[INVOICES] Intento no autorizado para generar facturas (token faltante o inválido)');
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid or missing X-INVOICE-JOB-TOKEN header' });
      }
    } else {
      console.warn('[INVOICES] INVOICE_JOB_TOKEN no configurado en el entorno; endpoint abierto (no recomendado)');
    }

    const DEFAULT_PRICE_PER_M3 = Number(process.env.DEFAULT_PRICE_PER_M3) || 50000; // COP por m3 por defecto

    // 1. Traer bookings que puedan facturarse (tienen amount_monthly > 0 o total_volume)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gt('amount_monthly', 0);

    if (bookingsError) {
      console.error('[INVOICES] Error cargando bookings:', bookingsError);
      return res.status(500).json({ error: 'db_error_loading_bookings', detail: bookingsError });
    }

    console.log(`[INVOICES] Bookings a procesar: ${bookings.length}`);

    const createdPayments = [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const booking of bookings) {
      try {
        // Evitar duplicados: buscar payments en últimos 30 días
        const { data: recentPayments, error: recentError } = await supabase
          .from('payments')
          .select('id, created_at')
          .eq('booking_id', booking.id)
          .gte('created_at', thirtyDaysAgo);

        if (recentError) {
          console.error('[INVOICES] Error buscando pagos recientes para booking', booking.id, recentError);
          continue;
        }

        if (recentPayments && recentPayments.length > 0) {
          console.log('[INVOICES] Ya existe pago/factura en últimos 30 días para booking', booking.id);
          continue; // saltar para no duplicar
        }

        // Calcular monto mensual
        let amountMonthly = Number(booking.amount_monthly) || 0;

        if (amountMonthly <= 0) {
          // Intentar sumar precios desde inventario
          const { data: inventoryItems, error: invErr } = await supabase
            .from('inventory')
            .select('*')
            .eq('booking_id', booking.id);

          if (!invErr && inventoryItems && inventoryItems.length > 0) {
            // Cada item puede tener `monthly_price` o `price` y quantity
            amountMonthly = inventoryItems.reduce((sum, it) => {
              const unit = Number(it.monthly_price || it.price || 0);
              const qty = Number(it.quantity || 1);
              return sum + unit * qty;
            }, 0);
          }
        }

        if (amountMonthly <= 0) {
          // Fallback por volumen
          const volume = Number(booking.total_volume) || 0;
          amountMonthly = volume * DEFAULT_PRICE_PER_M3;
        }

        // Normalizar a centavos
        const amountInCents = Math.round(amountMonthly * 100);

        const now = new Date().toISOString();
        const reference = `MONTHLY_${booking.id}_${new Date().toISOString().slice(0,7).replace('-','')}`; // e.g. MONTHLY_<id>_202601

        const paymentRecord = {
          booking_id: booking.id,
          wompi_reference: reference,
          status: 'PENDING',
          amount_in_cents: amountInCents,
          currency: 'COP',
          payment_method: 'system_generated',
          created_at: now,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('payments')
          .insert([paymentRecord])
          .select()
          .single();

        if (insertError) {
          console.error('[INVOICES] Error insertando payment para booking', booking.id, insertError);
          continue;
        }

        console.log('[INVOICES] Payment creado:', inserted.id, 'booking:', booking.id, 'amount:', amountMonthly);
        createdPayments.push(inserted);

      } catch (innerErr) {
        console.error('[INVOICES] Error procesando booking', booking.id, innerErr);
      }
    }

    return res.json({ success: true, created: createdPayments.length, payments: createdPayments });
  } catch (err) {
    console.error('[INVOICES] Error generando facturas mensuales:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend corriendo en puerto ${port}`);
  console.log("✅ Allowed origins:", allowedOrigins);
});
