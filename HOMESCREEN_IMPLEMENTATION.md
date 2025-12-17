# 🏠 HomeScreen - Selector de Modo de Calculadora

## ✅ Implementación Completa

Se ha creado una nueva pantalla de inicio (HomeScreen) que permite al usuario elegir entre dos métodos para calcular su espacio:

### 📋 Archivos Creados/Modificados:

1. **`/src/Components/HomeScreen.jsx`** (NUEVO)
   - Componente principal con dos cards interactivas
   - Adaptado a la paleta de colores de Quarto (#012E58, #074BED)
   - Iconos SVG para cada opción
   - Animaciones hover y transiciones suaves

2. **`/src/Components/index.js`** (MODIFICADO)
   - Exporta HomeScreen para uso global

3. **`/src/Screen/Calculator/Calculator.jsx`** (MODIFICADO)
   - Importa HomeScreen
   - Agrega `view: 'home'` como estado inicial
   - Agrega `mode: null` para trackear 'manual' o 'ai'
   - Nuevo action `SELECT_MODE` en el reducer
   - Actualizado `GO_BACK` para manejar navegación desde home
   - Renderiza HomeScreen en el switch de vistas

4. **`/src/index.css`** (MODIFICADO)
   - Agrega animación `@keyframes fade-in`
   - Clase `.animate-fade-in` para entrada suave

---

## 🎨 Características del Diseño

### Card 1: Seleccionar de la Lista (Manual)
- **Color primario**: Azul Quarto (#074BED → #012E58)
- **Icono**: Clipboard con lista
- **Descripción**: Calculadora interactiva con catálogo predefinido
- **Acción**: `onModeSelect('manual')` → va a vista 'calculator'

### Card 2: Subir Fotos con IA
- **Color primario**: Naranja (#FF6B35 → #F7931E)
- **Icono**: Cámara fotográfica
- **Descripción**: IA identifica objetos y calcula volumen
- **Acción**: `onModeSelect('ai')` → va a vista 'inventoryPhotos'

### Efectos Visuales:
- ✅ Hover con elevación de card (`hover:-translate-y-1`)
- ✅ Escala de ícono al hover (`group-hover:scale-110`)
- ✅ Cambio de color de borde al hover
- ✅ Sombra con color del tema al hover
- ✅ Flecha animada que aparece al hover (opacity 0 → 100)
- ✅ Entrada con fade-in y translateY

---

## 🔄 Flujo de Navegación

```
HOME (nueva)
  ↓
  ├─ Manual → CALCULATOR (lista de items) ← [Botón "Volver a elegir método"]
  │            ↓
  │         LOGISTICS → TRANSPORT/FINAL_SUMMARY → ...
  │
  └─ AI → INVENTORY_PHOTOS (subir fotos) ← [Botón "Volver" ya existente]
               ↓
            LOGISTICS → TRANSPORT/FINAL_SUMMARY → ...
```

### Navegación con Botón "Volver":
- **HOME**: Pantalla inicial con dos cards
- **CALCULATOR** (Manual): 
  - ✅ Nuevo botón "Volver a elegir método" → regresa a HOME
  - Permite cambiar a modo AI si el usuario se arrepiente
- **INVENTORY_PHOTOS** (AI):
  - ✅ Botón "Volver" existente → regresa a HOME
  - Permite cambiar a modo Manual si el usuario prefiere

### Comportamiento del Reducer:
- Desde `calculator` → `GO_BACK` → vuelve a `home`
- Desde `inventoryPhotos` → `GO_BACK` → vuelve a `home`
- Desde `logistics` → `GO_BACK` → vuelve a `calculator` (si manual) o `inventoryPhotos` (si AI)

---

## 🚀 Cómo Usar

El HomeScreen se muestra automáticamente cuando se carga la app (estado inicial: `view: 'home'`).

El usuario hace clic en una de las dos cards y:
1. **Manual**: Va directamente a la calculadora con la lista de items
2. **AI**: Va a la pantalla de subir fotos (InventoryPhotoScreen)

---

## 📝 Notas Técnicas

- **Estado inicial cambiado**: `view: 'calculator'` → `view: 'home'`
- **Nuevo estado**: `mode: null` (se setea a 'manual' o 'ai' al elegir)
- **Reducer action**: `SELECT_MODE` despacha el modo y navega automáticamente
- **Responsive**: Grid 1 columna (móvil) → 2 columnas (md+)
- **Accesibilidad**: Botones semánticos con hover states claros

---

## ✨ Resultado Final

Una pantalla de inicio moderna y profesional que:
- ✅ Presenta claramente las dos opciones
- ✅ Usa los colores de marca de Quarto
- ✅ Tiene animaciones suaves y atractivas
- ✅ Es completamente responsive
- ✅ Integra perfectamente con el flujo existente

🎉 **¡Listo para usar!**
