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

    return res.status(200).json({ received: true, bookingId, status });
  } catch (err) {
    console.error("[WOMPI WEBHOOK] Error:", err);
    // Aún así 200 para evitar reintentos infinitos por errores momentáneos
    return res.status(200).json({ received: true, warning: "webhook_exception" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend corriendo en puerto ${port}`);
  console.log("✅ Allowed origins:", allowedOrigins);
});
