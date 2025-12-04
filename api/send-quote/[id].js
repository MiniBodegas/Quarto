// api/send-quote/[id].js
import { Resend } from 'resend';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';
import QuoteTemplate from '../../src/mail/QuoteTemplate.jsx';

// ⚠️ Cliente admin solo para backend (usa service_role)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// La misma función de precios que tenías
function calculateStoragePrice(volume) {
  if (!volume || volume <= 0) return 0;
  const PRICE_LIST = [
    { volume: 0.5, price: 44000 },
    { volume: 1, price: 80900 },
    { volume: 2, price: 147000 },
    { volume: 3, price: 200400 },
    { volume: 4, price: 242900 },
    { volume: 5, price: 276000 },
    { volume: 6, price: 301100 },
    { volume: 7, price: 319400 },
    { volume: 8, price: 331800 },
    { volume: 9, price: 339300 },
    { volume: 10, price: 342700 },
  ];
  const sorted = [...PRICE_LIST].sort((a, b) => a.volume - b.volume);
  const tier = sorted.find((t) => t.volume >= volume);
  if (tier) return tier.price;
  const max = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const volDiff = max.volume - prev.volume;
  if (volDiff <= 0) return max.price;
  const pricePerM3Extra = (max.price - prev.price) / volDiff;
  const extraPrice = (volume - max.volume) * pricePerM3Extra;
  return Math.round(max.price + extraPrice);
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Solo permitimos GET, igual que en tu Express
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id } = req.query; // /api/send-quote/123 → id = 123
  console.log(`[send-quote] quoteId =`, id);

  try {
    // 1) Buscar la quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      console.error('❌ Error buscando quote:', quoteError);
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    // 2) Buscar items de inventory ligados a esa quote
    const { data: items, error: itemsError } = await supabase
      .from('inventory')
      .select('name, quantity, volume')
      .eq('quote_id', id);

    if (itemsError) {
      console.error('❌ Error buscando items:', itemsError);
      return res.status(400).json({ error: itemsError.message });
    }

    console.table(items || []);

    const plainItems = Array.isArray(items)
      ? items.map((it) => ({
          name: String(it.name ?? ''),
          quantity: Number(it.quantity ?? 0),
          volume: Number(it.volume ?? 0),
        }))
      : [];

    const computedTotalVolume = plainItems.reduce(
      (sum, it) => sum + Number(it.volume || 0) * Number(it.quantity || 1),
      0
    );

    const totalVolume =
      Number(quote.total_volume ?? 0) > 0
        ? Number(quote.total_volume)
        : Number(computedTotalVolume.toFixed(2));

    const storagePrice = calculateStoragePrice(totalVolume);

    const html = renderToStaticMarkup(
      QuoteTemplate({
        name: quote.name,
        date: (quote.created_at || '').toString().slice(0, 10),
        logisticsMethod: quote.logistics_method || 'En bodega',
        totalVolume,
        transportPrice: Number(quote.transport_price ?? 0),
        totalPrice: storagePrice,
        storagePrice,
        items: plainItems,
        contactName: quote.name,
        contactRole: 'Cliente Quarto',
        contactEmail: quote.email,
        website: 'www.quartoapp.com',
        logoUrl: 'https://ruta-a-tu-logo.com/logo.png',
        signatureUrl: 'https://ruta-a-tu-imagen-de-firma.com/firma.png',
      })
    );

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Quarto <onboarding@resend.dev>',
      to: quote.email,
      subject: 'Tu cotización de Quarto',
      html,
    });

    if (emailError) {
      console.error('❌ Error enviando correo:', emailError);
      return res.status(200).json({ ok: false, error: emailError.message });
    }

    console.log('✅ Correo enviado:', emailData);
    return res.status(200).json({ ok: true, emailData });
  } catch (err) {
    console.error('🔥 send-quote error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
