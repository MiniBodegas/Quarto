# 📸 AIPhotoUpload - Componente de Subida de Fotos con IA

## ✅ Implementación Completa

Se ha creado un sistema completo para subir fotos y analizarlas con IA (preparado para integración con Gemini).

---

## 📁 Estructura de Archivos Creados

### 1. **Componente Principal**
`/src/Components/calculator/AIPhotoUpload.jsx`
- Interfaz de usuario para subir fotos
- Drag & drop visual
- Previews de imágenes
- Validación de archivos
- Manejo de estados (loading, error)

### 2. **Screen Wrapper**
`/src/Screen/AIPhotoScreen/AIPhotoScreen.jsx`
- Wrapper que gestiona el estado
- Guarda resultados en localStorage
- Conecta con el flujo del Calculator

### 3. **Exports**
- `/src/Components/index.js` → exporta AIPhotoUpload
- `/src/Screen/index.js` → exporta AIPhotoScreen

### 4. **Integración en Calculator**
- Import de AIPhotoScreen
- Nueva vista 'aiPhotos' en el reducer
- Navegación actualizada (GO_BACK)
- Renderizado condicional

---

## 🎨 Características del Componente

### 📤 Área de Subida
- **Diseño**: Área grande con borde punteado azul
- **Icono**: Nube con flecha de subida
- **Hover**: Cambia de color al pasar el mouse
- **Input**: Acepta múltiples imágenes (PNG, JPG, JPEG)
- **Límite**: Máximo 5 imágenes

### 🖼️ Previews de Imágenes
- Grid responsive (2-3-5 columnas según pantalla)
- Imágenes con borde que cambia al hover
- Botón de eliminar en cada imagen (X roja)
- Contador: "Imágenes seleccionadas (X/5)"

### 💡 Tips y Ayudas
- Caja con consejos para mejores resultados:
  - Tomar fotos desde diferentes ángulos
  - Buena iluminación
  - Incluir todos los objetos
  - Evitar fotos borrosas

### ⚠️ Manejo de Errores
- Validación de tipo de archivo
- Mensaje si excede el límite de 5 imágenes
- Error de análisis (con try/catch)
- Mensajes en rojo con fondo suave

### 🔘 Botones de Acción
- **Volver**: Con icono de flecha (variante secondary)
- **Analizar con IA**: Botón principal con spinner cuando está procesando
- Estados disabled cuando corresponde

---

## 🔄 Flujo de Navegación Actualizado

```
HOME
  ↓
  ├─ Manual → CALCULATOR
  │
  └─ AI → AI_PHOTOS (NUEVO) ← Sube fotos y analiza con IA
              ↓
           LOGISTICS → TRANSPORT/FINAL_SUMMARY → ...
```

### Estados del Reducer:
- `view: 'aiPhotos'` - Nueva vista para análisis de IA
- `mode: 'ai'` - Indica que el usuario eligió el modo IA
- `GO_BACK` desde 'aiPhotos' → regresa a 'home'
- `GO_BACK` desde 'logistics' (modo ai) → regresa a 'aiPhotos'

---

## 🧠 Integración con IA (Preparado)

### Mock de Respuesta (actual):
```javascript
{
  items: [
    { name: 'Sofá', quantity: 1, volumeM3: 2.5, category: 'Sala de estar' },
    { name: 'Mesa', quantity: 1, volumeM3: 1.8, category: 'Comedor' },
  ],
  totalVolumeM3: 6.1,
  summary: 'Se detectaron varios muebles...'
}
```

### Para integrar Gemini:
1. Instala el paquete:
   ```bash
   npm install @google/genai
   ```

2. Crea el servicio:
   ```javascript
   // /src/services/geminiService.js
   import { GoogleGenAI } from "@google/genai";
   
   const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
   
   export const analyzeSpaceFromImage = async (imageFiles) => {
     // Convertir files a base64
     // Llamar a Gemini
     // Retornar resultados
   };
   ```

3. Reemplaza el mock en AIPhotoUpload.jsx línea 61:
   ```javascript
   import { analyzeSpaceFromImage } from '../../services/geminiService';
   
   // En handleAnalyze:
   const result = await analyzeSpaceFromImage(selectedFiles);
   onContinue(result);
   ```

---

## 🎨 Paleta de Colores

- **Principal**: `#074BED` (Azul Quarto brillante)
- **Secundario**: `#012E58` (Azul Quarto oscuro)
- **Fondo**: Gradiente de azul suave (`from-blue-50 to-indigo-50`)
- **Hover**: `from-blue-100 to-indigo-100`
- **Error**: Rojo con fondo `red-50`
- **Tips**: Azul con fondo `blue-50`

---

## 📱 Responsive Design

### Mobile (< 640px):
- 2 columnas en grid de previews
- Botones full-width apilados verticalmente
- Texto "Volver" en lugar de "Volver a elegir método"

### Tablet (640px - 768px):
- 3 columnas en grid de previews
- Botones en fila con flex

### Desktop (> 768px):
- 5 columnas en grid de previews
- Layout completo con espaciado amplio

---

## 🚀 Próximos Pasos

### Para completar la integración:

1. **Convertir resultados de IA a items**:
   ```javascript
   // En Calculator.jsx, caso 'aiPhotos':
   onContinue={(aiResults) => {
     aiResults.items.forEach(item => {
       addItem({
         name: item.name,
         quantity: item.quantity,
         volume: item.volumeM3,
         isCustom: true,
         category: item.category
       });
     });
     dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
   }}
   ```

2. **Agregar endpoint backend** (opcional):
   ```javascript
   // Backend/server.js
   app.post("/api/analyze-images", async (req, res) => {
     const { images } = req.body;
     const results = await callGeminiAPI(images);
     res.json(results);
   });
   ```

3. **Variables de entorno**:
   ```bash
   # .env
   VITE_GEMINI_API_KEY=tu_api_key_aqui
   ```

---

## ✨ Resultado Final

Un componente completo y funcional que:
- ✅ Permite subir hasta 5 imágenes
- ✅ Muestra previews bonitos
- ✅ Valida archivos
- ✅ Maneja errores elegantemente
- ✅ Está preparado para integración con Gemini AI
- ✅ Sigue el diseño y colores de Quarto
- ✅ Es completamente responsive
- ✅ Tiene animaciones y transiciones suaves

🎉 **¡Listo para usar y integrar con IA real!**
