// Serverrrrrrrrrrrrrrrrr Perfecto con wompiiiiiiiiiiiiiiii

import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// ✅ Cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// (Opcional pero recomendado) responder preflight
app.options("*", cors());

// ✅ Endpoint para firma integrity
app.post("/api/wompi/integrity", (req, res) => {
  try {
    const { reference, amountInCents, currency = "COP", publicKey } = req.body || {};

    if (!reference || !Number.isInteger(amountInCents) || !currency || !publicKey) {
      return res.status(400).json({ error: "Datos inválidos", received: req.body });
    }

    const isTest = publicKey.startsWith("pub_test_");

    const integritySecret = isTest
      ? process.env.WOMPI_INTEGRITY_SECRET_TEST
      : process.env.WOMPI_INTEGRITY_SECRET_PROD;

    if (!integritySecret) {
      return res.status(500).json({
        error: "Integrity secret no configurado para este ambiente",
        hint: isTest ? "Falta WOMPI_INTEGRITY_SECRET_TEST" : "Falta WOMPI_INTEGRITY_SECRET_PROD",
      });
    }

    // 🔎 DEBUG (NO imprimas el secret completo)
    console.log("[WOMPI] env:", isTest ? "TEST" : "PROD");
    console.log("[WOMPI] reference:", reference);
    console.log("[WOMPI] amountInCents:", amountInCents);
    console.log("[WOMPI] currency:", currency);
    console.log("[WOMPI] secret prefix:", integritySecret.slice(0, 14)); // "test_integrity_" o "prod_integrity_"

    // ✅ FORMATO OFICIAL WOMPI: "<Reference><Amount><Currency><IntegritySecret>"
    const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signatureIntegrity = crypto.createHash("sha256").update(raw).digest("hex");

    return res.json({ signatureIntegrity });
  } catch (err) {
    console.error("[WOMPI] integrity ERROR:", err);
    return res.status(500).json({ error: "Error generando firma" });
  }
});

// ✅ Webhook para recibir eventos de Wompi
app.post("/api/wompi/webhook", async (req, res) => {
  try {
    console.log("[WOMPI WEBHOOK] Evento recibido:", JSON.stringify(req.body, null, 2));

    const { event, data } = req.body;

    if (event === "transaction.updated") {
      const tx = data.transaction;

      const {
        id: transactionId,
        reference,
        status,
        amount_in_cents,
        currency,
        payment_method_type,
      } = tx;

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
        return res.status(500).json({ error: "Error buscando booking" });
      }

      if (!booking) {
        console.warn("[WOMPI WEBHOOK] No se encontró booking con referencia:", reference);
        return res.status(200).json({ received: true, warning: "Booking no encontrado" });      }

      const bookingId = booking.id;

      // 2️⃣ Actualizar estado del booking
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: status,
          wompi_transaction_id: transactionId,
          paid_at: status === "APPROVED" ? new Date().toISOString() : null,
        })
        .eq("wompi_reference", reference);

      if (updateError) {
        console.error("[WOMPI WEBHOOK] Error actualizando booking:", updateError);
        return res.status(500).json({ error: "Error actualizando booking" });
      }

      console.log("[WOMPI WEBHOOK] Booking actualizado:", bookingId, "→", status);

      // 3️⃣ Insertar registro en payments (idempotente por wompi_transaction_id)
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
            wompi_event: req.body,
          },
          { onConflict: "wompi_transaction_id" }
        );

      if (paymentError) {
        console.error("[WOMPI WEBHOOK] Error guardando payment:", paymentError);
        return res.status(500).json({ error: "Error guardando payment" });
      }

      console.log("[WOMPI WEBHOOK] Payment guardado:", transactionId);

      return res.status(200).json({ received: true, bookingId, status });
    }

    return res.status(200).json({ received: true, message: "Evento no procesado" });
  } catch (err) {
    console.error("[WOMPI WEBHOOK] Error:", err);
    return res.status(500).json({ error: "Error procesando webhook" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/wompi/ping", (req, res) => res.json({ ok: true, hasWebhook: true }));


app.listen(port, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${port}`);
});
