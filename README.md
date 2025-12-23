# Quarto - Sistema de Gestión de Almacenamiento

Portal web completo para gestión de servicios de almacenamiento (mini bodegas), con calculadora inteligente, gestión de inventario, pagos integrados y panel administrativo.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Flujos de Usuario](#-flujos-de-usuario)
- [Integraciones](#-integraciones)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Troubleshooting](#-troubleshooting)
- [Contribuir](#-contribuir)

## ✨ Características Principales

### Para Usuarios (Clientes)
- **Calculadora de Espacio**: Calcula el costo de almacenamiento según items y volumen
- **Modo Manual e IA**: Selección manual de items o detección por foto con Gemini AI
- **Gestión de Inventario**: Visualiza todos tus items almacenados en un solo lugar
- **Agregar Items**: Añade nuevos items a tu almacenamiento existente sin crear nueva reserva
- **Pagos Integrados**: Integración completa con Wompi para pagos en línea
- **Portal de Usuario**: Dashboard con facturas, pagos pendientes y historial
- **Personas Autorizadas**: Gestiona quién puede acceder a tu almacenamiento

### Para Administradores
- **Panel de Administración**: Gestión completa de usuarios y bookings
- **Gestión de Usuarios**: Crear, editar y administrar clientes
- **Control de Inventarios**: Ver y gestionar inventarios de todos los usuarios
- **Reportes de Pagos**: Seguimiento de pagos y facturación
- **Dashboard Analítico**: Métricas y estadísticas del negocio

## 🛠 Stack Tecnológico

### Frontend
- **React 18+**: Framework principal con Hooks
- **Vite**: Build tool y dev server ultrarrápido
- **React Router v6**: Navegación SPA
- **Tailwind CSS**: Estilos utility-first
- **Supabase Client**: Cliente para base de datos y autenticación

### Backend
- **Supabase**: Base de datos PostgreSQL con Auth y RLS
- **Node.js + Express**: Servidor para webhooks y APIs auxiliares
- **Gemini AI**: Detección de objetos en fotografías

### Servicios Externos
- **Wompi**: Pasarela de pagos (Colombia)
- **Google Gemini**: Análisis de imágenes con IA
- **Resend**: Envío de emails transaccionales

## 🏗 Arquitectura del Sistema

### Base de Datos (Supabase PostgreSQL)

#### Tablas Principales

**`users`** - Información de usuarios
```sql
- id (uuid, PK)
- email (text, unique)
- name (text)
- phone (text)
- created_at (timestamptz)
```

**`bookings`** - Reservas de almacenamiento
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- email (text)
- name (text)
- phone (text)
- booking_type (text) - 'person' | 'company'
- total_volume (numeric)
- total_items (integer)
- amount_monthly (numeric) - Costo mensual
- amount_total (numeric) - Costo inicial (transporte, etc)
- payment_status (text)
- wompi_transaction_id (text)
- wompi_reference (text)
- logistics_method (text) - 'Recogida' | 'Envío'
- transport_price (numeric)
- created_at (timestamptz)
```

**`inventory`** - Items almacenados
```sql
- id (uuid, PK)
- booking_id (uuid, FK → bookings)
- item_id (uuid, FK → items)
- name (text)
- quantity (integer)
- volume (numeric) - Volumen unitario en m³
- is_custom (boolean)
- short_code (text) - Código único del item
- created_at (timestamptz)
```

**`payments`** - Registro de pagos
```sql
- id (uuid, PK)
- booking_id (uuid, FK → bookings)
- wompi_transaction_id (text, unique)
- wompi_reference (text)
- status (text) - 'PENDING' | 'APPROVED' | 'DECLINED'
- amount_in_cents (integer)
- currency (text)
- payment_method (text)
- wompi_event (jsonb) - Datos completos del evento
- created_at (timestamptz)
```

**`items`** - Catálogo de items predefinidos
```sql
- id (uuid, PK)
- name (text)
- volume (numeric)
- category (text)
- image_url (text)
```

**`authorized_persons`** - Personas autorizadas a retirar
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- name (text)
- document_type (text)
- document_number (text)
- phone (text)
- relationship (text)
```

### Políticas de Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:
- Usuarios solo pueden ver/editar sus propios datos
- Las políticas se basan en `auth.uid()` de Supabase Auth
- Los administradores tienen políticas especiales para acceso total

## 📦 Instalación y Configuración

### Requisitos Previos
- Node.js >= 18
- npm >= 9
- Cuenta de Supabase
- Cuenta de Wompi (para pagos)
- API Key de Google Gemini (para IA)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/MiniBodegas/Quarto.git
cd Quarto

# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd Backend
npm install
cd ..
```

### Configuración de Variables de Entorno

Crear `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Wompi
VITE_WOMPI_PUBLIC_KEY=pub_prod_xxxxx
VITE_WOMPI_INTEGRITY_KEY=prod_integrity_xxxxx

# Google Gemini
VITE_GEMINI_API_KEY=tu-gemini-api-key

# Resend (para emails)
RESEND_API_KEY=re_xxxxx

# URLs
VITE_APP_URL=https://tu-dominio.com
VITE_BACKEND_URL=https://tu-backend.com
```

### Configuración de Supabase

1. **Crear proyecto en Supabase**
2. **Ejecutar migraciones** (ubicadas en `Backend/migrations/`)
3. **Configurar políticas RLS** para cada tabla
4. **Habilitar Email Auth** en configuración de Auth

### Ejecutar el Proyecto

```bash
# Frontend (desarrollo)
npm run dev

# Backend (webhooks y APIs)
cd Backend
node server.js

# Build para producción
npm run build
npm run preview
```

## 🎯 Módulos del Sistema

### 1. Calculadora de Espacio (`/`)

**Funcionalidad**: Calcula el costo de almacenamiento basado en items seleccionados.

**Modos de Cálculo**:
- **Manual**: Selección de items del catálogo predefinido
- **IA (Gemini)**: Sube fotos y la IA detecta los objetos automáticamente
- **Items Personalizados**: Agrega items no catalogados con dimensiones custom

**Flujo**:
1. Usuario selecciona modo (Manual/IA)
2. Agrega items al inventario temporal
3. Selecciona logística (Recogida/Envío propio)
4. Si es recogida, calcula precio de transporte
5. Muestra resumen con volumen total y costos
6. Captura datos del usuario (nombre, email, teléfono)
7. Genera orden de pago con Wompi
8. Redirige a pantalla de pago
9. Confirma reserva y crea booking en DB

**Características**:
- ✅ Cálculo automático de volumen (m³)
- ✅ Precios escalonados según volumen
- ✅ Integración con catálogo de 100+ items
- ✅ Preview de items con imágenes
- ✅ Validación de datos en tiempo real

### 2. Portal de Usuario (`/user`)

**Funcionalidad**: Dashboard personal del cliente con toda su información.

**Secciones**:

#### Dashboard Principal
- Resumen de bookings activos
- Espacio ocupado total
- Pagos pendientes destacados
- Acceso rápido a todas las funciones

#### Mi Inventario
- **Vista unificada** de todos los items del usuario
- Items agrupados por nombre con cantidades sumadas
- Volumen total ocupado
- Botón "Agregar Más Items"
- Códigos únicos (short_code) para cada item
- Historial de movimientos (próximamente)

#### Facturas y Pagos
- Lista de todas las facturas/pagos
- Estados: Pendiente, Pagado, Vencido
- Filtros por estado y fecha
- Botón de pago directo con Wompi
- Descarga de comprobantes (próximamente)

#### Personas Autorizadas
- Lista de personas que pueden retirar items
- Agregar/editar/eliminar autorizados
- Datos: nombre, documento, teléfono, parentesco

#### Estado de Cuenta
- Historial completo de transacciones
- Resumen de pagos realizados
- Próximos vencimientos

### 3. Agregar Items al Inventario Existente

**Funcionalidad**: Permite agregar nuevos items sin crear una nueva reserva.

**Flujo Inteligente**:
1. Usuario hace clic en "Agregar Más Items" desde el portal
2. Se marca flag en localStorage: `quarto_adding_items = true`
3. Redirige a calculadora (`/`)
4. Calculator detecta el flag y verifica:
   - ✅ Usuario tiene cuenta registrada (por email)
   - ✅ Usuario tiene bookings activos
5. Si cumple, salta directamente a selección de items (skip modo/home)
6. Usuario agrega items normalmente
7. En lugar de ir a Booking + Payment:
   - Guarda items directo en tabla `inventory`
   - Actualiza `total_volume` y `total_items` del booking
   - Recalcula `amount_monthly` con nuevo volumen
   - Crea registro en tabla `payments` con status PENDING
8. Muestra confirmación con referencia de pago
9. Al volver al portal, recarga datos automáticamente

**Características**:
- ✅ Detección automática de usuario existente
- ✅ Skip de pantallas innecesarias
- ✅ Recálculo automático de precios
- ✅ Generación de pago pendiente
- ✅ Recarga automática del portal

### 4. Integración de Pagos (Wompi)

**Funcionalidad**: Sistema completo de pagos en línea.

**Componentes**:

#### Generación de Orden
- Crea referencia única: `QUARTO-{booking-id}-{timestamp}`
- Calcula monto en centavos
- Genera hash de integridad
- Incluye metadata (email, nombre, booking_id)

#### Widget de Wompi
- Renderiza checkout embebido
- Maneja redirecciones (éxito, error)
- Captura eventos de pago

#### Webhooks (`Backend/server.js`)
- Escucha eventos de Wompi: `transaction.updated`
- Valida firma de integridad
- Actualiza estado en DB:
  - Actualiza `payment_status` en bookings
  - Crea/actualiza registro en payments
  - Guarda `wompi_transaction_id` y evento completo
- Envía email de confirmación (próximamente)

**Estados de Pago**:
- `PENDING`: Pago creado, esperando
- `APPROVED`: Pago exitoso
- `DECLINED`: Pago rechazado
- `VOIDED`: Pago anulado

### 5. IA con Gemini

**Funcionalidad**: Detección automática de objetos en fotografías.

**Flujo**:
1. Usuario sube hasta 5 fotos
2. Se envían a API de Gemini con prompt especializado
3. IA analiza y retorna JSON con objetos detectados:
   ```json
   {
     "items": [
       {
         "name": "Silla de comedor",
         "quantity": 4,
         "confidence": "high"
       }
     ]
   }
   ```
4. Sistema busca coincidencias en catálogo de items
5. Agrega automáticamente al inventario temporal
6. Usuario puede ajustar cantidades o agregar más

**Características**:
- ✅ Multi-imagen (hasta 5 fotos)
- ✅ Detección con confianza (high/medium/low)
- ✅ Matching inteligente con catálogo
- ✅ Fallback a items custom si no hay match

### 6. Panel de Administración (`/admin`)

**Funcionalidad**: Herramientas de gestión para staff.

**Acceso**: Login separado con credenciales de admin.

**Funciones**:
- Ver todos los usuarios y bookings
- Editar información de usuarios
- Gestionar inventarios
- Ver reportes de pagos
- Estadísticas del negocio
- Exportar datos

## 🔄 Flujos de Usuario

### Flujo 1: Nueva Reserva Completa

```
Usuario → Calculadora → Selecciona Modo (Manual/IA)
   ↓
Agrega Items → Selecciona Logística → Calcula Transporte (si aplica)
   ↓
Resumen Final → Captura Datos Usuario → Genera Orden Wompi
   ↓
Pantalla de Pago (Wompi Widget) → Pago Exitoso → Webhook Actualiza DB
   ↓
Confirmación → Email (próximamente) → Usuario ve booking en Portal
```

### Flujo 2: Agregar Items a Reserva Existente

```
Usuario en Portal → Click "Agregar Más Items"
   ↓
localStorage.setItem('quarto_adding_items', 'true') → navigate('/')
   ↓
Calculator.useEffect detecta flag → Verifica usuario por email
   ↓
¿Tiene cuenta? SÍ → ¿Tiene bookings? SÍ → Skip a Calculator
   ↓
Agrega Items → Resumen → Click "Guardar"
   ↓
handleSaveItemsToExisting():
  - Inserta items en inventory
  - Actualiza booking (volume, items, monthly_price)
  - Crea pago PENDING en payments
   ↓
Confirmación con referencia de pago → Click "Volver al Portal"
   ↓
localStorage.setItem('quarto_adding_items', 'completed')
   ↓
Portal detecta flag → loadUserData() recarga todo
   ↓
Usuario ve items nuevos + pago pendiente
```

### Flujo 3: Pago de Factura Pendiente

```
Usuario en Portal → Sección "Facturas y Pagos"
   ↓
Ve pago PENDING → Click "Pagar Ahora"
   ↓
Genera orden Wompi → Abre widget de pago
   ↓
Completa pago → Webhook recibe evento
   ↓
Actualiza status a APPROVED → Usuario ve "Pagado"
```

## 🔗 Integraciones

### Supabase

**Configuración**:
```javascript
// src/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Uso**:
```javascript
// Consulta
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('user_id', userId)

// Inserción
const { data, error } = await supabase
  .from('inventory')
  .insert([{ name: 'Silla', quantity: 5 }])

// Auth
const { data: { user } } = await supabase.auth.getUser()
```

### Wompi

**Generación de Hash de Integridad**:
```javascript
// src/utils/wompi.js
import CryptoJS from 'crypto-js';

export function generateWompiIntegrity(reference, amountInCents, currency) {
  const integrityKey = import.meta.env.VITE_WOMPI_INTEGRITY_KEY;
  const concatenated = `${reference}${amountInCents}${currency}${integrityKey}`;
  return CryptoJS.SHA256(concatenated).toString();
}
```

**Renderizar Widget**:
```javascript
// src/Components/WompiButton.jsx
const wompiData = {
  'public-key': import.meta.env.VITE_WOMPI_PUBLIC_KEY,
  'currency': 'COP',
  'amount-in-cents': totalAmount * 100,
  'reference': wompiReference,
  'signature:integrity': generateWompiIntegrity(wompiReference, totalAmount * 100, 'COP'),
  'redirect-url': `${window.location.origin}/user`
};

<form action="https://checkout.wompi.co/p/" method="GET">
  {Object.entries(wompiData).map(([key, value]) => (
    <input key={key} type="hidden" name={key} value={value} />
  ))}
  <button type="submit">Pagar con Wompi</button>
</form>
```

**Webhook Handler**:
```javascript
// Backend/server.js
app.post('/api/wompi/webhook', async (req, res) => {
  const { event, data, signature } = req.body;
  
  // Validar firma
  const computedSignature = generateSignature(event, data);
  if (signature.checksum !== computedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Procesar evento
  if (event === 'transaction.updated') {
    await supabase
      .from('payments')
      .update({ 
        status: data.transaction.status,
        wompi_transaction_id: data.transaction.id 
      })
      .eq('wompi_reference', data.transaction.reference);
  }
  
  res.status(200).json({ received: true });
});
```

### Google Gemini AI

**Configuración**:
```javascript
// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

**Análisis de Imágenes**:
```javascript
export async function analyzeImages(imageFiles) {
  const imageParts = await Promise.all(
    imageFiles.map(async (file) => ({
      inlineData: {
        data: await fileToBase64(file),
        mimeType: file.type
      }
    }))
  );

  const prompt = `
    Analiza las imágenes y lista TODOS los objetos/items visibles.
    Devuelve un JSON con este formato:
    {
      "items": [
        { "name": "Nombre del objeto", "quantity": cantidad, "confidence": "high|medium|low" }
      ]
    }
  `;

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  
  return JSON.parse(text);
}
```

## 📂 Estructura del Proyecto

```
Quarto/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/            # Imágenes, iconos
│   ├── Components/        # Componentes React
│   │   ├── calculator/   # Componentes de calculadora
│   │   │   ├── BookingScreen.jsx
│   │   │   ├── ConfirmationScreen.jsx
│   │   │   ├── FinalSummaryScreen.jsx
│   │   │   └── PaymentScreen.jsx
│   │   ├── ui/           # Componentes UI reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Select.jsx
│   │   ├── Header.jsx
│   │   ├── Inventory.jsx
│   │   ├── Invoices.jsx
│   │   ├── Portal.jsx
│   │   └── WompiButton.jsx
│   ├── Screen/           # Pantallas principales
│   │   ├── Calculator/   # Pantalla de calculadora
│   │   │   └── Calculator.jsx (964 líneas - orquestador principal)
│   │   ├── UserScreen/   # Portal de usuario
│   │   │   └── UserScreen.jsx (770 líneas)
│   │   └── AdminScreen/  # Panel admin
│   ├── data/             # Datos estáticos
│   │   ├── constants.js
│   │   ├── prices.js     # Precios escalonados
│   │   └── transportRates.js
│   ├── hooks/            # Custom hooks
│   │   ├── useInventory.js
│   │   ├── usePortalData.js
│   │   └── useItemsByCategory.js
│   ├── services/         # Servicios externos
│   │   ├── geminiService.js
│   │   └── saveStorageRequest.js
│   ├── utils/            # Utilidades
│   │   ├── pricing.js    # Cálculos de precio
│   │   └── wompi.js      # Helpers de Wompi
│   ├── router/           # Configuración de rutas
│   │   └── appRouter.jsx
│   ├── supabase.js       # Cliente de Supabase
│   ├── App.jsx           # Componente principal
│   └── main.jsx          # Entry point
├── Backend/
│   ├── server.js         # Servidor Express (webhooks)
│   ├── supabase.js       # Cliente backend de Supabase
│   ├── migrations/       # Migraciones SQL
│   └── package.json
├── .env                  # Variables de entorno
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (Vite)
npm run dev:backend      # Inicia servidor backend (Express)

# Build
npm run build            # Construye para producción
npm run preview          # Preview del build de producción

# Linting
npm run lint             # Ejecuta ESLint

# Base de datos
npm run db:migrate       # Ejecuta migraciones pendientes
npm run db:seed          # Carga datos de prueba
```

## 🔐 Variables de Entorno

### Frontend (`.env`)

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Wompi (Producción)
VITE_WOMPI_PUBLIC_KEY=pub_prod_xxxxxxxxxxxxx
VITE_WOMPI_INTEGRITY_KEY=prod_integrity_xxxxxxxxxxxxx

# Wompi (Testing)
# VITE_WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxx
# VITE_WOMPI_INTEGRITY_KEY=test_integrity_xxxxxxxxxxxxx

# Google Gemini
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# URLs
VITE_APP_URL=https://quarto.com
VITE_BACKEND_URL=https://api.quarto.com

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Backend (`.env` en `/Backend`)

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Wompi
WOMPI_WEBHOOK_SECRET=prod_events_xxxxxxxxxxxxx

# Server
PORT=3001
NODE_ENV=production
```

## 🐛 Troubleshooting

### Problema: No se crean facturas al agregar items

**Síntoma**: Al agregar items a un booking existente, no se genera pago/factura.

**Causa**: Sistema actualiza solo el `amount_monthly` del booking, no crea pago adicional.

**Solución**: Diseño intencional - el nuevo monto mensual se cobra automáticamente el próximo mes. No se crea factura inmediata.

---

### Problema: Precio incorrecto al agregar items

**Síntoma**: Usuario tiene 6m³ pero se muestra precio de < 1m³.

**Causa**: `total_volume` viene como string de la DB, concatena en vez de sumar: `"6" + 0.13 = "60.13"`.

**Solución**:
```javascript
// Convertir explícitamente a número
const previousVolume = Number(currentBooking.total_volume) || 0;
const updatedTotalVolume = previousVolume + newVolume;
```

---

### Problema: Auth error "auth.uid() is null"

**Síntoma**: RLS policies rechazan queries con error de auth.

**Causa**: `auth.uid()` en Supabase no coincide con `users.id`.

**Solución**: Buscar usuarios por email en lugar de por auth.uid():
```javascript
const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('email', session.user.email)
  .single();
```

---

### Problema: Items duplicados en inventario

**Síntoma**: Se muestran items repetidos con cantidades separadas.

**Causa**: Items no agrupados por nombre.

**Solución**: Implementar agrupación en frontend:
```javascript
const groupedItems = items.reduce((acc, item) => {
  const key = item.name.toLowerCase();
  if (!acc[key]) {
    acc[key] = { ...item, quantity: 0 };
  }
  acc[key].quantity += item.quantity;
  return acc;
}, {});
```

---

### Problema: Webhook de Wompi no se ejecuta

**Síntoma**: Pagos no se actualizan en DB después de completar en Wompi.

**Solución**:
1. Verificar URL del webhook en dashboard de Wompi
2. Validar que el endpoint sea público (no localhost)
3. Usar ngrok para testing local:
   ```bash
   ngrok http 3001
   # Usar URL de ngrok en configuración de Wompi
   ```
4. Revisar logs del servidor para errores de validación de firma

---

### Problema: Imágenes no se analizan con Gemini

**Síntoma**: Error al subir fotos para análisis IA.

**Causa**: API key inválida o límite de rate excedido.

**Solución**:
1. Verificar `VITE_GEMINI_API_KEY` en `.env`
2. Revisar cuota en Google AI Studio
3. Verificar formato de imágenes (JPG/PNG, < 4MB)

---

### Problema: Precios no coinciden con volumen

**Síntoma**: Volumen total correcto pero precio incorrecto.

**Causa**: Tabla `PRICE_LIST` desactualizada o error en `calculateStoragePrice()`.

**Solución**: Verificar precios en `src/data/prices.js`:
```javascript
export const PRICE_LIST = [
  { volume: 0.5, price: 44000 },
  { volume: 1, price: 80900 },
  { volume: 2, price: 147000 },
  // ... etc
];
```

## 🚀 Roadmap

### Q1 2025
- [ ] Sistema de notificaciones por email (Resend)
- [ ] Descarga de facturas en PDF
- [ ] Historial de movimientos de inventario
- [ ] Recordatorios de pago automáticos

### Q2 2025
- [ ] App móvil (React Native)
- [ ] Sistema de reservas por fecha
- [ ] Chat de soporte en vivo
- [ ] Programa de referidos

### Q3 2025
- [ ] Integración con más pasarelas de pago
- [ ] Sistema de descuentos y promociones
- [ ] Analytics avanzado
- [ ] API pública para integraciones

## 📄 Licencia

Este proyecto es propiedad de **MiniBodegas** y está protegido por derechos de autor.

Uso no autorizado está prohibido.

## 👥 Contribuir

### Equipo de Desarrollo
- **Lead Developer**: Juan Esteban Ramirez
- **Backend**: En desarrollo
- **UI/UX**: En desarrollo

### Cómo Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'Add: nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Convenciones de Código

- **Componentes**: PascalCase (`UserScreen.jsx`)
- **Funciones**: camelCase (`calculatePrice()`)
- **Constantes**: UPPER_SNAKE_CASE (`PRICE_LIST`)
- **Archivos utils**: camelCase (`pricing.js`)

### Commits

Usar prefijos:
- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bug
- `Update:` Actualización de feature existente
- `Refactor:` Refactorización de código
- `Docs:` Documentación

## 📞 Soporte

- **Email**: soporte@quarto.com
- **Issues**: [GitHub Issues](https://github.com/MiniBodegas/Quarto/issues)
- **Documentación técnica**: Ver `DOCS_TECNICAS.md`

---

**Última actualización**: 22 de diciembre de 2025
**Versión**: 1.0.0
**Estado**: En producción 🚀