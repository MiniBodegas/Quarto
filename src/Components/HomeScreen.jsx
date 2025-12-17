import React from 'react';

const HomeScreen = ({ onModeSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#012E58] mb-4 tracking-tight">
          ¿Cómo quieres calcular tu <span className="text-[#074BED]">espacio?</span>
        </h1>
        <p className="text-lg text-[#012E58]/70 max-w-2xl mx-auto">
          Elige el método que prefieras para crear tu inventario y calcular el espacio necesario.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Card Manual - Lista */}
        <button
          onClick={() => onModeSelect('manual')}
          className="group relative flex flex-col items-center p-8 bg-white rounded-3xl border-2 border-slate-200 hover:border-[#074BED] shadow-xl hover:shadow-2xl hover:shadow-[#074BED]/20 transition-all duration-300 transform hover:-translate-y-1 text-left"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#074BED] to-[#012E58] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#012E58] mb-3 group-hover:text-[#074BED] transition-colors">
            Seleccionar de la Lista
          </h3>
          <p className="text-[#012E58]/60 text-center leading-relaxed">
            Usa nuestra calculadora interactiva para agregar tus muebles y artículos uno por uno desde nuestro catálogo predefinido.
          </p>
          <span className="mt-8 text-[#074BED] font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Ir a la calculadora
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 8l4 4m0 0l-4 4m4-4H3" 
              />
            </svg>
          </span>
        </button>

        {/* Card AI - Foto */}
        <button
          onClick={() => onModeSelect('ai')}
          className="group relative flex flex-col items-center p-8 bg-white rounded-3xl border-2 border-slate-200 hover:border-[#FF6B35] shadow-xl hover:shadow-2xl hover:shadow-[#FF6B35]/20 transition-all duration-300 transform hover:-translate-y-1 text-left"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#012E58] mb-3 group-hover:text-[#FF6B35] transition-colors">
            Subir Fotos con IA
          </h3>
          <p className="text-[#012E58]/60 text-center leading-relaxed">
            Toma fotos de tus espacios o artículos. Nuestra inteligencia artificial identificará y calculará el volumen automáticamente.
          </p>
          <span className="mt-8 text-[#FF6B35] font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Comenzar con IA
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 8l4 4m0 0l-4 4m4-4H3" 
              />
            </svg>
          </span>
        </button>
      </div>

      {/* Optional: Info Section */}
      <div className="mt-12 text-center max-w-2xl">
        <p className="text-sm text-[#012E58]/50">
          Ambos métodos te llevarán al mismo proceso de cotización y reserva.
        </p>
      </div>
    </div>
  );
};

export default HomeScreen;
