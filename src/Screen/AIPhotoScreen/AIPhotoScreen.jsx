import { useState } from 'react';
import AIPhotoUpload from '../../Components/calculator/AIPhotoUpload';

const AIPhotoScreen = ({ onContinue, onBack }) => {
  const [aiResults, setAiResults] = useState(null);

  const handleAIAnalysisComplete = (results) => {
    console.log('[AIPhotoScreen] Resultados de IA:', results);
    
    // Guardar resultados en localStorage
    localStorage.setItem('quarto_ai_analysis', JSON.stringify(results));
    
    // Continuar al siguiente paso
    onContinue(results);
  };

  return (
    <AIPhotoUpload
      onContinue={handleAIAnalysisComplete}
      onBack={onBack}
    />
  );
};

export default AIPhotoScreen;
