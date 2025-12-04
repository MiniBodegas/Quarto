import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { Resend } from 'resend';
import { renderToStaticMarkup } from 'react-dom/server';
import { supabase } from '../supabase.js';
import QuoteTemplate from '../../src/mail/QuoteTemplate.jsx';

// Inicializa Express y CORS antes de rutas
const app = express();
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.use(express.json());

// Instancia única de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Healthcheck
app.get('/health', (_req, res) => res.status(200).send('OK'));

// Log de todas las peticiones
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Calcula precio de almacenamiento según PRICE_LIST escalonado
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
  const sorted = [...PRICE_LIST].sort((a,b) => a.volume - b.volume);
  const tier = sorted.find(t => t.volume >= volume);
  if (tier) return tier.price;
  const max = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const volDiff = max.volume - prev.volume;
  if (volDiff <= 0) return max.price;
  const pricePerM3Extra = (max.price - prev.price) / volDiff;
  const extraPrice = (volume - max.volume) * pricePerM3Extra;
  return Math.round(max.price + extraPrice);
}

// Enviar correo por quote_id
app.get('/send-quote/:id', async (req, res) => {
  try {
    const quoteId = req.params.id;

    const { data: quote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const { data: items, error: itemsError } = await supabase
      .from('inventory')
      .select('name, quantity, volume')
      .eq('quote_id', quoteId);

    if (itemsError) return res.status(400).json({ error: itemsError.message });

    // Log para verificar
    console.table(items);

    // Normaliza a arreglo plano (evita proxys/refs)
    const plainItems = Array.isArray(items) ? items.map(it => ({
      name: String(it.name ?? ''),
      quantity: Number(it.quantity ?? 0),
      volume: Number(it.volume ?? 0),
    })) : [];

    // Calcula volumen total desde inventory si el de la quote no está
    const computedTotalVolume = plainItems.reduce(
      (sum, it) => sum + Number(it.volume || 0) * Number(it.quantity || 1), 0
    );

    const totalVolume = Number(quote.total_volume ?? 0) > 0
      ? Number(quote.total_volume)
      : Number(computedTotalVolume.toFixed(2));

    // Precio mensual de almacenamiento por volumen total calculado
    const storagePrice = calculateStoragePrice(totalVolume);

    const html = renderToStaticMarkup(
      QuoteTemplate({
        name: quote.name,
        date: (quote.created_at || '').toString().slice(0, 10),
        logisticsMethod: quote.logistics_method || 'En bodega',
        totalVolume,                           // usa volumen calculado
        transportPrice: Number(quote.transport_price ?? 0),
        totalPrice: storagePrice,              // total = almacenamiento
        storagePrice,
        items: plainItems,                     // usa los items normalizados
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

    if (emailError) return res.status(200).json({ ok: false, error: emailError.message });
    return res.status(200).json({ ok: true, emailData });
  } catch (err) {
    console.error('send-quote error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta raíz y 404 para confirmar que el server responde
app.get('/', (_req, res) => res.status(200).send('Mail API running'));
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.path }));

app.listen(3001, () => {
  console.log('Mail server listening on http://localhost:3001');
});