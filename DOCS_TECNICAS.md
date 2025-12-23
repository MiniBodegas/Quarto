# Documentación Técnica - Quarto

Documentación técnica detallada complementaria al README principal.

## 🔗 Integración con Wompi

### Generación de Hash de Integridad

```javascript
import CryptoJS from 'crypto-js'

const generateIntegritySignature = (reference, amountInCents, currency, integrityKey) => {
  const concatenated = `${reference}${amountInCents}${currency}${integrityKey}`
  return CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(concatenated))
}

// Ejemplo de uso
const reference = `QUARTO-${bookingId}-${Date.now()}`
const amountInCents = 276000 * 100 // $276,000 COP
const currency = 'COP'
const signature = generateIntegritySignature(
  reference,
  amountInCents,
  currency,
  import.meta.env.VITE_WOMPI_INTEGRITY_KEY
)
```

### Implementación del Widget

```jsx
// WompiButton.jsx
const WompiButton = ({ amount, reference, onSuccess }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    // El formulario redirige a Wompi checkout
  }

  return (
    <form 
      action="https://checkout.wompi.co/p/" 
      method="GET"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="public-key" value={publicKey} />
      <input type="hidden" name="currency" value="COP" />
      <input type="hidden" name="amount-in-cents" value={amount * 100} />
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="signature:integrity" value={signature} />
      <input type="hidden" name="redirect-url" value={redirectUrl} />
      
      <button type="submit">
        Pagar ${amount.toLocaleString('es-CO')} COP
      </button>
    </form>
  )
}
```

### Manejo de Webhooks

```javascript
// Backend/server.js
const express = require('express')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Validar firma del webhook
function validateSignature(data, signature, secret) {
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex')
    
  return calculatedSignature === signature
}

app.post('/api/webhooks/wompi', async (req, res) => {
  try {
    const { event, data, signature } = req.body
    
    // Validar firma
    if (!validateSignature(data, signature.checksum, process.env.WOMPI_EVENTS_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    
    // Procesar según tipo de evento
    if (event === 'transaction.updated') {
      const {
        reference,
        status,
        id: transactionId,
        payment_method_type
      } = data.transaction
      
      console.log(`[Webhook] Transaction ${transactionId}: ${status}`)
      
      // Actualizar payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: status,
          wompi_transaction_id: transactionId,
          payment_method: payment_method_type,
          wompi_event: data
        })
        .eq('wompi_reference', reference)
      
      if (paymentError) {
        console.error('[Webhook] Error updating payment:', paymentError)
      }
      
      // Actualizar booking si está APPROVED
      if (status === 'APPROVED') {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'APPROVED',
            wompi_transaction_id: transactionId
          })
          .eq('wompi_reference', reference)
        
        if (bookingError) {
          console.error('[Webhook] Error updating booking:', bookingError)
        }
        
        // TODO: Enviar email de confirmación
      }
    }
    
    res.status(200).json({ received: true })
    
  } catch (error) {
    console.error('[Webhook] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(3001, () => {
  console.log('🚀 Webhook server running on port 3001')
})
```

## 🤖 Integración con Gemini AI

### Servicio de Análisis de Imágenes

```javascript
// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Convertir archivo a base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Limpiar respuesta JSON de Gemini
function cleanJsonResponse(text) {
  // Remover markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  
  // Remover texto antes/después del JSON
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
  }
  
  return cleaned.trim()
}

// Analizar múltiples imágenes
export async function analyzeImages(imageFiles) {
  try {
    console.log('[Gemini] Analyzing', imageFiles.length, 'images')
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Convertir imágenes a base64
    const imageParts = await Promise.all(
      imageFiles.map(async (file) => ({
        inlineData: {
          data: await fileToBase64(file),
          mimeType: file.type
        }
      }))
    )
    
    // Prompt especializado
    const prompt = `
      Analiza estas imágenes de un espacio (habitación, bodega, oficina, etc.) 
      y lista TODOS los objetos/muebles visibles.
      
      Para cada objeto detectado, indica:
      - name: Nombre descriptivo del objeto en español
      - quantity: Cantidad de unidades visibles
      - confidence: Nivel de confianza en la detección (high/medium/low)
      
      Retorna ÚNICAMENTE un JSON válido con este formato:
      {
        "items": [
          {"name": "Silla de comedor", "quantity": 4, "confidence": "high"},
          {"name": "Mesa de centro", "quantity": 1, "confidence": "high"}
        ]
      }
      
      NO incluyas explicaciones adicionales, solo el JSON.
    `
    
    // Generar contenido
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()
    
    console.log('[Gemini] Raw response:', text)
    
    // Parsear JSON
    const cleanedText = cleanJsonResponse(text)
    const parsed = JSON.parse(cleanedText)
    
    console.log('[Gemini] ✅ Detected', parsed.items.length, 'items')
    
    return parsed
    
  } catch (error) {
    console.error('[Gemini] ❌ Error:', error)
    throw new Error('Error al analizar las imágenes con IA')
  }
}

// Buscar coincidencias en catálogo
export function matchItemsWithCatalog(detectedItems, catalogItems) {
  return detectedItems.map(detected => {
    // Buscar por nombre similar (fuzzy matching básico)
    const match = catalogItems.find(item => 
      item.name.toLowerCase().includes(detected.name.toLowerCase()) ||
      detected.name.toLowerCase().includes(item.name.toLowerCase())
    )
    
    if (match) {
      return {
        ...match,
        quantity: detected.quantity,
        confidence: detected.confidence,
        isCustom: false
      }
    } else {
      // No hay match, crear item custom
      return {
        id: `custom-${Date.now()}-${Math.random()}`,
        name: detected.name,
        quantity: detected.quantity,
        volume: 0.5, // Volumen default
        confidence: detected.confidence,
        isCustom: true
      }
    }
  })
}
```

### Uso en Componente

```jsx
// AIPhotoScreen.jsx
import { analyzeImages, matchItemsWithCatalog } from '../../services/geminiService'

const AIPhotoScreen = () => {
  const [images, setImages] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  
  const handleAnalyze = async () => {
    if (images.length === 0) return
    
    setAnalyzing(true)
    
    try {
      // Analizar con Gemini
      const geminiResults = await analyzeImages(images)
      
      // Buscar coincidencias en catálogo
      const { data: catalogItems } = await supabase
        .from('items')
        .select('*')
      
      const matched = matchItemsWithCatalog(
        geminiResults.items,
        catalogItems || []
      )
      
      setResults(matched)
      
      // Agregar al inventario
      matched.forEach(item => addItem(item))
      
      // Navegar a resumen
      navigate('/calculator')
      
    } catch (error) {
      alert(error.message)
    } finally {
      setAnalyzing(false)
    }
  }
  
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        max={5}
        onChange={(e) => setImages(Array.from(e.target.files))}
      />
      
      <button onClick={handleAnalyze} disabled={analyzing}>
        {analyzing ? 'Analizando...' : 'Analizar con IA'}
      </button>
      
      {results && (
        <div>
          <h3>Items Detectados: {results.length}</h3>
          {results.map((item, i) => (
            <div key={i}>
              {item.name} x{item.quantity} ({item.confidence})
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 💾 Hooks Personalizados

### useInventory

Hook para gestionar inventario con persistencia en localStorage.

```javascript
// src/hooks/useInventory.js
import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'quarto_inventory'

export const useInventory = () => {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        console.log('[useInventory] 📦 Loaded', parsed.length, 'items from localStorage')
        return parsed
      } catch (error) {
        console.error('[useInventory] Error parsing localStorage:', error)
        return []
      }
    }
    return []
  })
  
  // Sincronizar con localStorage
  useEffect(() => {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      console.log('[useInventory] 🧹 localStorage limpiado (no hay items)')
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      console.log('[useInventory] 💾 Guardados', items.length, 'items en localStorage')
    }
  }, [items])
  
  // Agregar item
  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      
      if (existing) {
        // Incrementar cantidad
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        )
      } else {
        // Agregar nuevo
        return [...prev, { ...item, quantity: item.quantity || 1 }]
      }
    })
  }, [])
  
  // Actualizar cantidad
  const updateItemQuantity = useCallback((id, quantity) => {
    setItems(prev => {
      if (quantity <= 0) {
        // Remover si cantidad es 0
        return prev.filter(i => i.id !== id)
      }
      return prev.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
    })
  }, [])
  
  // Remover item
  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])
  
  // Limpiar todo
  const clearAll = useCallback(() => {
    setItems([])
  }, [])
  
  // Calcular volumen total
  const totalVolume = items.reduce((sum, item) => 
    sum + (item.volume * item.quantity), 0
  )
  
  // Items seleccionados (cantidad > 0)
  const selectedItems = items.filter(i => i.quantity > 0)
  
  return {
    items,
    selectedItems,
    totalVolume,
    addItem,
    updateItemQuantity,
    removeItem,
    clearAll
  }
}
```

### usePortalData

Hook para gestionar datos del portal de usuario.

```javascript
// src/hooks/usePortalData.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export const usePortalData = (userId) => {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [inventory, setInventory] = useState([])
  const [invoices, setInvoices] = useState([])
  const [authorizedPersons, setAuthorizedPersons] = useState([])
  
  useEffect(() => {
    if (!userId) return
    
    loadAllData()
  }, [userId])
  
  const loadAllData = async () => {
    setLoading(true)
    
    try {
      // Cargar bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      setBookings(bookingsData || [])
      
      // Cargar inventario
      if (bookingsData && bookingsData.length > 0) {
        const bookingIds = bookingsData.map(b => b.id)
        
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('*')
          .in('booking_id', bookingIds)
        
        setInventory(inventoryData || [])
      }
      
      // Cargar pagos/facturas
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', bookingsData?.map(b => b.id) || [])
        .order('created_at', { ascending: false })
      
      setInvoices(paymentsData || [])
      
      // Cargar personas autorizadas
      const { data: authPersonsData } = await supabase
        .from('authorized_persons')
        .select('*')
        .eq('user_id', userId)
      
      setAuthorizedPersons(authPersonsData || [])
      
    } catch (error) {
      console.error('[usePortalData] Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    bookings,
    inventory,
    invoices,
    authorizedPersons,
    reload: loadAllData
  }
}
```

## 🧮 Cálculo de Precios

### Función Principal

```javascript
// src/utils/pricing.js
import { PRICE_LIST } from '../data/prices'

/**
 * Calcula el precio mensual de almacenamiento basado en el volumen
 * @param {number} volume - Volumen en m³
 * @returns {number} - Precio mensual en COP
 */
export function calculateStoragePrice(volume) {
  if (volume <= 0) return 0
  
  // Buscar coincidencia exacta
  const exactMatch = PRICE_LIST.find(p => p.volume === volume)
  if (exactMatch) return exactMatch.price
  
  // Buscar rango
  let lower = null
  let upper = null
  
  for (let i = 0; i < PRICE_LIST.length; i++) {
    if (PRICE_LIST[i].volume < volume) {
      lower = PRICE_LIST[i]
    } else if (PRICE_LIST[i].volume > volume && !upper) {
      upper = PRICE_LIST[i]
      break
    }
  }
  
  // Si es menor que el mínimo
  if (!lower && upper) {
    return upper.price
  }
  
  // Si es mayor que el máximo
  if (lower && !upper) {
    const lastEntry = PRICE_LIST[PRICE_LIST.length - 1]
    const pricePerM3 = lastEntry.price / lastEntry.volume
    return Math.round(pricePerM3 * volume)
  }
  
  // Interpolar
  if (lower && upper) {
    const ratio = (volume - lower.volume) / (upper.volume - lower.volume)
    return Math.round(lower.price + (upper.price - lower.price) * ratio)
  }
  
  return 0
}

/**
 * Calcula el precio de transporte basado en la distancia
 * @param {number} distance - Distancia en km
 * @returns {number} - Precio de transporte en COP
 */
export function calculateTransportPrice(distance) {
  const BASE_PRICE = 20000 // Precio base
  const PRICE_PER_KM = 2000 // Por kilómetro adicional
  const FREE_DISTANCE = 5 // Primeros 5km gratis
  
  if (distance <= FREE_DISTANCE) {
    return BASE_PRICE
  }
  
  const additionalKm = distance - FREE_DISTANCE
  return BASE_PRICE + (additionalKm * PRICE_PER_KM)
}
```

### Tabla de Precios

```javascript
// src/data/prices.js
export const PRICE_LIST = [
  { volume: 1, price: 57200 },
  { volume: 1.5, price: 85800 },
  { volume: 2, price: 114400 },
  { volume: 2.5, price: 143000 },
  { volume: 3, price: 171600 },
  { volume: 3.5, price: 200200 },
  { volume: 4, price: 228800 },
  { volume: 4.5, price: 257400 },
  { volume: 5, price: 286000 },
  { volume: 5.5, price: 314600 },
  { volume: 6, price: 343200 },
  { volume: 6.5, price: 371800 },
  { volume: 7, price: 400400 },
  { volume: 7.5, price: 429000 },
  { volume: 8, price: 457600 },
  // ... continúa hasta volúmenes más grandes
]
```

---

*Documento de referencia técnica para desarrolladores - Quarto 2025*
