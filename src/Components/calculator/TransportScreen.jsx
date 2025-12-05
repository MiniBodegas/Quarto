import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './icons';
import { calculateTransportPrice } from '../../utils/pricing';
import { Input, Select, Button, ScreenHeader } from '../index';

// Función para guardar los datos de transporte en localStorage
function saveTransportToLocal(data) {
  localStorage.setItem('quarto_transport', JSON.stringify(data));
}

const CITIES = ['Cali'];
const STREET_TYPES = ['Avenida', 'Calle', 'Carrera', 'Transversal', 'Diagonal', 'Circular'];

const TransportScreen = ({ totalVolume, onContinue, onBack }) => {
  const [city, setCity] = useState(CITIES[0]);
  const [streetType, setStreetType] = useState(STREET_TYPES[1]);
  const [streetName, setStreetName] = useState('');
  const [number1, setNumber1] = useState('');
  const [number2, setNumber2] = useState('');
  const [hasNoNumber, setHasNoNumber] = useState(false);
  const [complement, setComplement] = useState('');
  const [transportPrice, setTransportPrice] = useState(null);

  useEffect(() => {
    setTransportPrice(calculateTransportPrice(totalVolume));
  }, [totalVolume]);

  useEffect(() => {
    if (hasNoNumber) {
      setNumber1('');
      setNumber2('');
    }
  }, [hasNoNumber]);

  const handleContinue = () => {
    const transportData = {
      city,
      street_type: streetType,
      street_name: streetName,
      number1,
      number2,
      has_no_number: hasNoNumber,
      complement,
      total_volume: totalVolume,
      transport_price: transportPrice,
    };
    saveTransportToLocal(transportData);
    onContinue(transportPrice);
  };

  const isFormValid =
    streetName.trim() !== '' &&
    (hasNoNumber || (number1.trim() !== '' && number2.trim() !== ''));

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="Información de recogida"
          subtitle="Ingresa la dirección donde recogeremos tus pertenencias."
        />

        <div className="mt-4 bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">

          <Select
            id="city-select"
            label="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled
            className="!bg-white dark:!bg-transparent !rounded-lg !px-3 !py-2.5 !text-[#012E58] disabled:bg-white dark:disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="street-type-select"
              label="Tipo de vía"
              value={streetType}
              onChange={(e) => setStreetType(e.target.value)}
              className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
            >
              {STREET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input
              id="street-name-input"
              label={streetType}
              type="text"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              placeholder="Ej. 93 sur"
              required
              className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <label
                className={`block text-sm font-medium text-[#012E58] mb-2 transition-opacity ${
                  hasNoNumber ? 'opacity-50' : 'opacity-100'
                }`}
              >
                Número
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[#012E58] font-bold transition-opacity ${
                    hasNoNumber ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  #
                </span>
                <Input
                  id="number1-input"
                  label="Número principal"
                  hideLabel
                  type="text"
                  value={number1}
                  onChange={(e) => setNumber1(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 28"
                  required
                  disabled={hasNoNumber}
                  className="!rounded-lg !px-3 !py-2.5 !text-[#012E58] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                />
                <span
                  className={`text-slate-500 font-bold transition-opacity ${
                    hasNoNumber ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  -
                </span>
                <Input
                  id="number2-input"
                  label="Número secundario"
                  hideLabel
                  type="text"
                  value={number2}
                  onChange={(e) => setNumber2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 34"
                  required
                  disabled={hasNoNumber}
                  className="!rounded-lg !px-3 !py-2.5 !text-[#012E58] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHasNoNumber((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm text-[#012E58] font-semibold"
            >
              <span
                className={`material-symbols-outlined text-2xl transition-colors ${
                  hasNoNumber ? 'text-[#074BED]' : 'text-slate-500'
                }`}
              >
                {hasNoNumber ? 'check_box' : 'check_box_outline_blank'}
              </span>
              <span>No tengo número</span>
            </button>
          </div>

          <Input
            id="complement-input"
            label="Complemento de dirección"
            type="text"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Ej. Torre 7, apto 3, portería, etc."
            className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
          />

          <div className="mt-2 rounded-2xl border border-dashed border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Estimación del transporte
              </p>
              <p className="text-[11px] text-slate-500">
                Según el volumen aproximado de tus pertenencias.
              </p>
            </div>
            <p className="text-2xl font-extrabold text-[#012E58]">
              {formatCurrency(transportPrice)}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              onClick={handleContinue}
              disabled={!isFormValid}
              className="flex-1 sm:flex-none sm:w-48 !py-2.5 font-bold shadow-lg hover:shadow-xl"
            >
              Continuar
            </Button>
            <Button
              onClick={onBack}
              variant="secondary"
              icon={<ArrowLeftIcon className="w-5 h-5" />}
              className="flex-1 sm:flex-none sm:w-40 !py-2.5"
            >
              Volver
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransportScreen;
