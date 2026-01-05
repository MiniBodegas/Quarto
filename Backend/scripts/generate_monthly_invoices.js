#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[SCRIPT] Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  try {
    console.log('[SCRIPT] Iniciando generación mensual de facturas (modo CLI)');

    const DEFAULT_PRICE_PER_M3 = Number(process.env.DEFAULT_PRICE_PER_M3) || 50000;

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gt('amount_monthly', 0);

    if (bookingsError) {
      console.error('[SCRIPT] Error cargando bookings:', bookingsError);
      process.exit(2);
    }

    console.log(`[SCRIPT] Bookings candidatas: ${bookings.length}`);

    const created = [];

    // Ejecutar diariamente: sólo crear invoice si hoy es el día de facturación del booking
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();

    const formatYYYYMM = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

    for (const booking of bookings) {
      try {
        // Determinar día de facturación: preferir booking.billing_day si existe, si no usar el día de created_at
        const billingDay = booking.billing_day ? Number(booking.billing_day) : (booking.created_at ? new Date(booking.created_at).getDate() : 1);

        // Calcular día máximo del mes actual (manejar meses cortos)
        const daysInMonth = new Date(todayYear, todayMonth, 0).getDate();
        const billingDayThisMonth = Math.min(billingDay, daysInMonth);

        // Sólo procesar si hoy es el día de facturación para este booking
        if (todayDay !== billingDayThisMonth) {
          // No es día de facturación para este booking
          console.log(`[SCRIPT] Skipping booking ${booking.id} - billing day ${billingDayThisMonth} (today ${todayDay})`);
          continue;
        }

        // Generar referencia única por periodo (YYYYMM)
        const period = formatYYYYMM(todayYear, todayMonth);
        const reference = `MONTHLY_${booking.id}_${period}`;

        // Evitar duplicados buscando por wompi_reference exacta (idempotencia)
        const { data: existing, error: existingErr } = await supabase
          .from('payments')
          .select('id')
          .eq('wompi_reference', reference)
          .limit(1);

        if (existingErr) {
          console.error('[SCRIPT] Error buscando payment existente para reference', reference, existingErr);
          continue;
        }

        if (existing && existing.length > 0) {
          console.log('[SCRIPT] Payment ya existe para periodo', period, 'booking', booking.id);
          continue;
        }

        let amountMonthly = Number(booking.amount_monthly) || 0;

        if (amountMonthly <= 0) {
          const { data: inventoryItems, error: invErr } = await supabase
            .from('inventory')
            .select('*')
            .eq('booking_id', booking.id);

          if (!invErr && inventoryItems && inventoryItems.length > 0) {
            amountMonthly = inventoryItems.reduce((sum, it) => {
              const unit = Number(it.monthly_price || it.price || 0);
              const qty = Number(it.quantity || 1);
              return sum + unit * qty;
            }, 0);
          }
        }

        if (amountMonthly <= 0) {
          const volume = Number(booking.total_volume) || 0;
          amountMonthly = volume * DEFAULT_PRICE_PER_M3;
        }

        const amountInCents = Math.round(amountMonthly * 100);
        const now = new Date().toISOString();

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
          console.error('[SCRIPT] Error insertando payment para booking', booking.id, insertError);
          continue;
        }

        console.log('[SCRIPT] Payment creado:', inserted.id, 'booking:', booking.id, 'amount:', amountMonthly);
        created.push(inserted);
      } catch (err) {
        console.error('[SCRIPT] Error procesando booking', booking.id, err);
      }
    }

    console.log(`[SCRIPT] Finalizado. Payments creados: ${created.length}`);
    process.exit(0);
  } catch (err) {
    console.error('[SCRIPT] Error fatal:', err);
    process.exit(3);
  }
}

run();
