#!/usr/bin/env node
import dotenv from 'dotenv'

// Prefer the built-in global fetch (Node 18+). If missing, dynamically import node-fetch as a fallback.
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    // top-level await is allowed in ESM; dynamically import node-fetch
    const mod = await import('node-fetch');
    fetchFn = mod.default || mod;
  } catch (e) {
    console.error('fetch is not available and node-fetch could not be imported. Install node-fetch or use Node 18+');
    process.exit(1);
  }
}

const fetch = fetchFn;

dotenv.config()

const ALEGRA_API_URL = process.env.ALEGRA_API_URL || 'https://api.alegra.com/api/v1'
const ALEGRA_API_TOKEN = process.env.ALEGRA_API_TOKEN

if (!ALEGRA_API_TOKEN) {
  console.error('Error: set ALEGRA_API_TOKEN in env before running this test')
  process.exit(1)
}

async function run() {
  // Payload adapted from your example (fixed typo 'quantity')
  const payload = {
    items: [
      { id: '1', price: 120, quantity: 5 },
      {
        id: '2',
        description: 'Cartera de cuero color café',
        price: 85,
        quantity: 1,
        discount: 10,
        tax: [{ id: '6' }]
      }
    ],
    client: '2',
    date: '2015-11-15',
    dueDate: '2015-12-15'
  }

  console.log('==> Posting payload to Alegra:', JSON.stringify(payload, null, 2))

  try {
    // Build Authorization header:
    // - If ALEGRA_USERNAME + ALEGRA_API_TOKEN are set, Alegra expects Basic auth (username:token)
    // - Otherwise, try Bearer token if only ALEGRA_API_TOKEN is present
    const headers = { 'Content-Type': 'application/json' }
    if (process.env.ALEGRA_USERNAME && ALEGRA_API_TOKEN) {
      const basic = Buffer.from(`${process.env.ALEGRA_USERNAME}:${ALEGRA_API_TOKEN}`).toString('base64')
      headers.Authorization = `Basic ${basic}`
    } else {
      headers.Authorization = `Bearer ${ALEGRA_API_TOKEN}`
    }

    const res = await fetch(`${ALEGRA_API_URL}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    let body
    try { body = JSON.parse(text) } catch (e) { body = text }

    console.log('Status:', res.status)
    console.log('Response body:', JSON.stringify(body, null, 2))
  } catch (err) {
    console.error('Request error:', err)
    process.exit(1)
  }
}

run()
