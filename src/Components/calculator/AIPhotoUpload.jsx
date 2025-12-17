import { useState } from 'react';
import { Button, ScreenHeader, Spinner } from '../index';
import { ArrowLeftIcon } from './icons';
import { analyzeSpaceFromImage } from '../../services/geminiService';

const AIPhotoUpload = ({ onContinue, onBack }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Validar que sean imágenes
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son imágenes válidas');
      setTimeout(() => setError(''), 3000);
    }

    // Limitar a 5 imágenes
    const filesToAdd = validFiles.slice(0, 5 - selectedFiles.length);
    
    if (filesToAdd.length === 0) {
      setError('Máximo 5 imágenes permitidas');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Crear previews
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setError('');
  };

  const handleRemoveImage = (index) => {
    // Liberar URL del preview
    URL.revokeObjectURL(previews[index]);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError('Por favor selecciona al menos una imagen');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      console.log('[AIPhotoUpload] Analizando', selectedFiles.length, 'imágenes...');
      
      // Llamada real a Gemini
      const result = await analyzeSpaceFromImage(selectedFiles);
      
      console.log('[AIPhotoUpload] Resultados recibidos:', result);
      
      onContinue(result);
    } catch (err) {
      console.error('Error analizando imágenes:', err);
      setError(err.message || 'Error al analizar las imágenes. Por favor intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="Sube fotos de tus espacios"
          subtitle="Nuestra IA identificará los objetos y calculará el volumen necesario automáticamente."
        />

        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {/* Área de subida */}
          <div className="mb-6">
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#074BED] rounded-2xl cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-16 h-16 mb-4 text-[#074BED]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-lg font-semibold text-[#012E58]">
                  Haz clic para subir fotos
                </p>
                <p className="text-sm text-[#012E58]/70">
                  PNG, JPG, JPEG (máx. 5 imágenes)
                </p>
              </div>
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={selectedFiles.length >= 5}
              />
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#012E58] mb-4">
                Imágenes seleccionadas ({previews.length}/5)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-slate-200 group-hover:border-[#074BED] transition-colors"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                      title="Eliminar imagen"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-[#012E58] mb-2">💡 Consejos para mejores resultados:</h4>
            <ul className="text-sm text-[#012E58]/80 space-y-1 list-disc list-inside">
              <li>Toma fotos desde diferentes ángulos de la habitación</li>
              <li>Asegúrate de que haya buena iluminación</li>
              <li>Incluye todos los objetos que quieres almacenar</li>
              <li>Evita fotos borrosas o muy oscuras</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button
              variant="secondary"
              onClick={onBack}
              icon={<ArrowLeftIcon className="w-5 h-5" />}
              className="w-full sm:w-auto"
              disabled={isAnalyzing}
            >
              Volver
            </Button>

            <Button
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || isAnalyzing}
              className="w-full sm:w-auto sm:min-w-[200px] font-bold"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Analizando...</span>
                </div>
              ) : (
                'Analizar con IA'
              )}
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-[#012E58]/60">
          <p>
            La inteligencia artificial analizará tus fotos para identificar objetos y calcular el espacio necesario.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AIPhotoUpload;
