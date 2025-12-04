import { useEffect, useState } from 'react';
import { ArrowLeftIcon, TruckIcon, WarehouseIcon } from './icons';
import { ScreenHeader, Button } from '../index';

const ResultsScreen = ({ totalVolume, totalItems, onBack, onContinue }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    if (totalItems === 0) onBack();
  }, [totalItems, onBack]);

  const logisticsOptions = [
    {
      id: 'recogida',
      method: 'Recogida',
      Icon: TruckIcon,
      title: 'Quarto lo recoge por mí',
      description: 'Lo recogemos en tu ubicación y lo traemos a nuestras instalaciones.',
      info: 'Se aplicarán cargos de transporte.',
    },
    {
      id: 'dropoff',
      method: 'En bodega',
      Icon: WarehouseIcon,
      title: 'Yo lo llevo a la bodega',
      description: 'Tráelo tú mismo a nuestro centro de almacenaje y ahorra costos.',
      info: 'Servicio gratuito.',
    },
  ];

  const handleContinue = (method) => {
    localStorage.setItem('quarto_logistics_method', method);
    onContinue(method);
  };

  const OptionCard = ({ option, isSelected, onSelect }) => (
    <button
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Seleccionar opción: ${option.title}`}
      className={`w-full text-left rounded-2xl transition-all duration-200 bg-white/95 backdrop-blur border ${
        isSelected ? 'border-[#0B5FFF] shadow-xl' : 'border-slate-200 shadow-sm hover:shadow-md'
      } p-6 hover:border-[#0B5FFF]/60`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl transition-colors ${
            isSelected ? 'bg-[#0B5FFF]' : 'bg-slate-100'
          }`}
        >
          <option.Icon
            className={`text-3xl transition-colors ${
              isSelected ? 'text-white' : 'text-slate-600'
            }`}
          />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <h3 className="text-lg font-bold text-[#012E58]">{option.title}</h3>
          <p className="text-sm text-[#012E58]">{option.description}</p>
          <p className="text-xs font-semibold text-[#012E58] mt-2">{option.info}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="¿Cómo prefieres guardar tus cosas?"
          subtitle={
            <>
              Tu inventario: <strong>{totalItems}</strong> artículos (Total:{' '}
              <strong>{totalVolume.toFixed(1)} m³</strong>)
            </>
          }
        />

        <div className="mt-4 bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#012E58]/6 text-[#012E58] text-sm font-semibold">
            <span>🚚</span> Elige tu método logístico
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {logisticsOptions.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedMethod === option.method}
                onSelect={() => setSelectedMethod(option.method)}
              />
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              onClick={() => selectedMethod && handleContinue(selectedMethod)}
              disabled={!selectedMethod}
              className="flex-1 sm:flex-none sm:w-48 !py-2.5 font-bold shadow-lg hover:shadow-xl"
            >
              Continuar
            </Button>
            <Button
              variant="secondary"
              onClick={onBack}
              icon={<ArrowLeftIcon className="w-5 h-5" />}
              className="flex-1 sm:flex-none sm:w-48 !py-2.5"
            >
              Volver al inventario
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultsScreen;