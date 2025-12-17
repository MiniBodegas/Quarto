# 🤖 Configuración de Gemini AI

## ✅ Implementación Completada

Se ha integrado Google Gemini AI para analizar imágenes y detectar objetos automáticamente.

---

## 📝 Archivos Creados/Modificados

### 1. **Servicio de Gemini**
`/src/services/geminiService.js`
- Inicializa el cliente de Google Generative AI
- Convierte archivos File a base64
- Envía imágenes y prompt a Gemini
- Parsea respuesta JSON
- Maneja errores

### 2. **Componente Actualizado**
`/src/Components/calculator/AIPhotoUpload.jsx`
- Importa `analyzeSpaceFromImage`
- Reemplaza mock con llamada real
- Maneja errores de API

### 3. **Variables de Entorno**
`/.env`
- Agrega `VITE_GEMINI_API_KEY`

### 4. **Dependencias**
- Instalado: `@google/generative-ai`

---

## 🔑 Cómo Obtener tu API Key de Gemini

### Paso 1: Ir a Google AI Studio
Visita: https://makersuite.google.com/app/apikey

### Paso 2: Crear API Key
1. Haz clic en "Create API Key"
2. Selecciona un proyecto de Google Cloud (o crea uno nuevo)
3. Copia la API key generada

### Paso 3: Configurar en tu Proyecto
Edita el archivo `.env` en la raíz del proyecto:

```bash
VITE_GEMINI_API_KEY=TU_API_KEY_AQUI
```

**⚠️ Importante:**
- NO subas el `.env` a Git (ya está en `.gitignore`)
- La API key es gratuita con límites generosos
- En producción, usa variables de entorno de Vercel/Netlify

---

## 🎯 Cómo Funciona

### 1. Usuario sube imágenes
```javascript
// AIPhotoUpload.jsx
const handleAnalyze = async () => {
  const result = await analyzeSpaceFromImage(selectedFiles);
  onContinue(result);
};
```

### 2. Gemini analiza las fotos
```javascript
// geminiService.js
export const analyzeSpaceFromImage = async (imageFiles) => {
  // Convierte imágenes a base64
  const imageParts = await Promise.all(
    imageFiles.map(fileToGenerativePart)
  );
  
  // Envía a Gemini con prompt
  const result = await model.generateContent([
    ...imageParts,
    { text: prompt }
  ]);
  
  return JSON.parse(result);
};
```

### 3. Respuesta de Gemini
```json
{
  "items": [
    {
      "name": "Sofá",
      "quantity": 1,
      "lengthM": 2.0,
      "widthM": 0.9,
      "heightM": 0.8,
      "volumeM3": 1.44,
      "category": "Sala de estar"
    },
    {
      "name": "Mesa de comedor",
      "quantity": 1,
      "lengthM": 1.5,
      "widthM": 0.9,
      "heightM": 0.75,
      "volumeM3": 1.01,
      "category": "Comedor y cocina"
    }
  ],
  "totalVolumeM3": 2.45,
  "summary": "Se detectaron 2 muebles principales con un volumen total de 2.45 m³"
}
```

---

## 🎨 Categorías Soportadas

El prompt instruye a Gemini para clasificar objetos en:
- **Sala de estar**
- **Comedor y cocina**
- **Dormitorio**
- **Oficina**
- **Varios**

---

## 📊 Prompt Optimizado

El prompt enviado a Gemini:
- ✅ Solicita respuesta en ESPAÑOL
- ✅ Pide dimensiones en METROS
- ✅ Calcula volumen en m³
- ✅ Evita duplicados entre fotos
- ✅ Usa estándares de industria para dimensiones
- ✅ Genera resumen conciso

---

## 🚀 Próximos Pasos

### Convertir resultados a items del inventario

En `Calculator.jsx`, procesa los resultados:

```javascript
case 'aiPhotos':
  return (
    <AIPhotoScreen
      onBack={() => dispatch({ type: 'GO_BACK' })}
      onContinue={(aiResults) => {
        // Convertir items de IA a items del inventario
        aiResults.items.forEach(item => {
          addItem({
            name: item.name,
            quantity: item.quantity,
            volume: item.volumeM3,
            width: item.widthM,
            height: item.heightM,
            depth: item.lengthM,
            isCustom: true,
            categoryId: mapCategoryToId(item.category)
          });
        });
        
        // Navegar a logistics
        dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
      }}
    />
  );
```

---

## 💰 Límites y Costos

### Plan Gratuito de Gemini:
- **60 requests por minuto**
- **1,500 requests por día**
- **1 millón de tokens por mes**

Para la mayoría de casos, el plan gratuito es suficiente.

---

## 🔧 Troubleshooting

### Error: "API key not valid"
✅ Verifica que copiaste la key completa
✅ Asegúrate de que empiece con el prefijo correcto
✅ Reinicia el servidor de desarrollo: `npm run dev`

### Error: "No response from AI"
✅ Verifica tu conexión a internet
✅ Revisa los límites de tu API key
✅ Chequea la consola del navegador para más detalles

### Error: "Invalid JSON response"
✅ El modelo puede devolver markdown (`\`\`\`json`)
✅ El servicio ya maneja esto automáticamente
✅ Si persiste, revisa el prompt

---

## ✨ Resultado Final

Un sistema completo que:
- ✅ Usa Google Gemini AI real
- ✅ Analiza hasta 5 imágenes simultáneamente
- ✅ Identifica objetos en español
- ✅ Calcula dimensiones realistas
- ✅ Clasifica por categorías
- ✅ Genera volumen total
- ✅ Proporciona resumen descriptivo
- ✅ Maneja errores elegantemente

🎉 **¡Lista para analizar fotos con IA!**

---

## 📚 Recursos Adicionales

- [Documentación de Gemini](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Límites y cuotas](https://ai.google.dev/pricing)
