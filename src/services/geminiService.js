import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Convierte un File a la estructura que necesita Gemini
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      // Remover el prefijo "data:image/jpeg;base64,"
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analiza imágenes para identificar objetos y calcular volumen
 * @param {File[]} imageFiles - Array de archivos de imagen
 * @returns {Promise<Object>} - Resultados del análisis con items, volumen total y resumen
 */
export const analyzeSpaceFromImage = async (imageFiles) => {
  try {
    // Convertir todas las imágenes a base64
    const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));

    const prompt = `
      Actúa como un experto estimador de mudanzas y logística. 
      Analiza las imágenes proporcionadas. Identifica todos los muebles, cajas, electrodomésticos y objetos visibles que ocuparían espacio en un camión de mudanza o bodega. Evita duplicados si el mismo objeto aparece en múltiples fotos desde diferentes ángulos.
      
      Para cada objeto identificado:
      1. Identifica el nombre en ESPAÑOL.
      2. Estima la cantidad de elementos idénticos.
      3. Consulta tu base de conocimientos de dimensiones estándar para ese tipo de objeto y estima su Largo, Ancho y Alto en METROS.
      4. Calcula el volumen en metros cúbicos (m³) (Largo * Ancho * Alto * Cantidad).
      5. Clasifícalo utilizando EXACTAMENTE una de las siguientes categorías en español según la habitación a la que pertenece típicamente: 'Sala de estar', 'Comedor y cocina', 'Dormitorio', 'Oficina', 'Varios'.

      Genera un resumen general muy conciso y directo en ESPAÑOL sobre el volumen total y la complejidad de la carga. NO listes los artículos en el resumen, el resumen es solo una visión general.
      
      Es CRUCIAL que las dimensiones sean estimaciones realistas basadas en estándares de la industria.
      IMPORTANTE: Todo el texto de salida DEBE estar en ESPAÑOL.

      Devuelve un JSON con esta estructura:
      {
        "items": [
          {
            "name": "string",
            "quantity": number,
            "lengthM": number,
            "widthM": number,
            "heightM": number,
            "volumeM3": number,
            "category": "string"
          }
        ],
        "totalVolumeM3": number,
        "summary": "string"
      }
    `;

    // Obtener el modelo (versión estable y rápida)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2, // Bajamos la temperatura para que sea más preciso
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
        responseMimeType: "application/json", // Respuesta en JSON puro
      },
    });

    // Ejecutar la generación
    const result = await model.generateContent([
      ...imageParts,
      { text: prompt }
    ]);

    // Obtener el texto de forma segura
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error("La IA no devolvió resultados.");
    }

    // Parsear el resultado (ya viene como JSON directo)
    const parsedResult = JSON.parse(responseText);

    // Validar estructura
    if (!parsedResult.items || !Array.isArray(parsedResult.items)) {
      throw new Error("Respuesta inválida de la IA: falta el array de items");
    }

    if (typeof parsedResult.totalVolumeM3 !== 'number') {
      throw new Error("Respuesta inválida de la IA: falta totalVolumeM3");
    }

    console.log('[Gemini] Análisis completado:', parsedResult);

    return parsedResult;

  } catch (error) {
    console.error("Error analizando imágenes con Gemini:", error);
    throw new Error(`Error en el análisis de imágenes: ${error.message}`);
  }
};
