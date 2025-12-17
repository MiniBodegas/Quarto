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
  let responseText = ''; // Declarar fuera del try para acceso en catch
  
  try {
    // ✅ Validar tamaño de imágenes antes de procesar
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB por imagen
    const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      throw new Error(`Las siguientes imágenes son muy grandes: ${fileNames}. Máximo 4MB por imagen.`);
    }

    // Convertir todas las imágenes a base64
    const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));

    const prompt = `
Eres un experto en mudanzas. Analiza las imágenes e identifica SOLO los muebles y objetos principales visibles.

INSTRUCCIONES:
1. Nombre del objeto en ESPAÑOL (corto y claro)
2. Cantidad de objetos idénticos
3. Dimensiones estimadas en METROS (Largo, Ancho, Alto) - usa estándares de la industria
4. Calcula volumen: Largo × Ancho × Alto × Cantidad
5. Categoría: 'Sala de estar', 'Comedor y cocina', 'Dormitorio', 'Oficina', o 'Varios'

IMPORTANTE:
- Evita duplicados si ves el mismo objeto en varias fotos
- Sé breve en el resumen (máximo 2 líneas)
- Usa números decimales completos (1.5 en lugar de 1.)

Devuelve este JSON exacto:
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
    `.trim();

    // Obtener el modelo (usar gemini-1.5-flash que es más estable)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192, // ✅ Aumentado para evitar truncamiento
        responseMimeType: "application/json",
      },
    });

    // Ejecutar la generación
    const result = await model.generateContent([
      ...imageParts,
      { text: prompt }
    ]);

    // Obtener el texto de forma segura
    const response = await result.response;
    responseText = response.text();
    
    if (!responseText) {
      throw new Error("La IA no devolvió resultados.");
    }

    console.log('[Gemini] Respuesta cruda:', responseText);
    console.log('[Gemini] Longitud de respuesta:', responseText.length);

    // Verificar si el JSON está truncado (termina abruptamente)
    const lastChar = responseText.trim().slice(-1);
    if (lastChar !== '}' && lastChar !== ']') {
      console.warn('[Gemini] ⚠️ JSON parece truncado, última letra:', lastChar);
      throw new Error('La respuesta de IA está incompleta. Intenta con menos fotos o fotos más pequeñas.');
    }

    // Limpiar JSON mal formado (decimales incompletos como "1." → "1.0")
    responseText = responseText
      .replace(/:\s*(\d+)\.\s*,/g, ': $1.0,')  // "lengthM": 1., → "lengthM": 1.0,
      .replace(/:\s*(\d+)\.\s*}/g, ': $1.0}')  // "lengthM": 1. } → "lengthM": 1.0 }
      .replace(/:\s*(\d+)\.\s*\n/g, ': $1.0\n'); // decimales con salto de línea

    // Parsear el resultado
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Gemini] Error parseando JSON:', parseError);
      console.error('[Gemini] JSON problemático:', responseText.substring(0, 500), '...');
      throw new Error('No se pudo procesar la respuesta de IA. Intenta con fotos más pequeñas.');
    }

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
    
    if (error instanceof SyntaxError) {
      console.error("JSON inválido recibido:", responseText);
      throw new Error('La IA devolvió una respuesta incompleta. Intenta con menos fotos o reduce el tamaño de las imágenes.');
    }
    
    // Propagar error con mensaje amigable
    const userMessage = error.message || 'Error desconocido al analizar imágenes';
    throw new Error(userMessage);
  }
};
