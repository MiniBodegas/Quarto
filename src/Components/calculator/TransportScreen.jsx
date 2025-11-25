import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './icons';
import { calculateTransportPrice } from '../../utils/pricing';
import {Input, Select, Button, ScreenHeader} from '../index';

const CITIES = ["Cali"];
const STREET_TYPES = ["Avenida", "Calle", "Carrera", "Transversal", "Diagonal", "Circular"];

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
        if (transportPrice !== null) onContinue(transportPrice);
    };

    const isFormValid = streetName.trim() !== '' && (hasNoNumber || (number1.trim() !== '' && number2.trim() !== ''));

    return (
        <div className="min-h-screen flex flex-col">
            <main className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 flex-grow flex flex-col">
                 <ScreenHeader 
                    title="Información de recogida"
                    subtitle="Ingresa la dirección donde recogeremos tus pertenencias."
                />
                
                <div className="space-y-6 w-full">
                    <Select
                        id="city-select"
                        label="Ciudad"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled
                        className="disabled:bg-muted dark:disabled:bg-muted-dark disabled:cursor-not-allowed"
                    >
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            id="street-type-select"
                            label="Tipo de Calle"
                            value={streetType}
                            onChange={(e) => setStreetType(e.target.value)}
                        >
                            {STREET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </Select>
                        <Input
                            id="street-name-input"
                            label={streetType}
                            type="text"
                            value={streetName}
                            onChange={(e) => setStreetName(e.target.value)}
                            placeholder="Ej. 93 sur"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                         <div>
                            <label className={`block font-normal text-slate-900 dark:text-slate-50 mb-2 transition-opacity ${hasNoNumber ? 'opacity-50' : 'opacity-100'}`}>Número</label>
                            <div className="flex items-center gap-2">
                                <span className={`text-slate-500 font-bold transition-opacity ${hasNoNumber ? 'opacity-50' : 'opacity-100'}`}>#</span>
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
                                    className="!w-24 disabled:bg-muted dark:disabled:bg-muted-dark disabled:cursor-not-allowed"
                                />
                                <span className={`text-slate-500 font-bold transition-opacity ${hasNoNumber ? 'opacity-50' : 'opacity-100'}`}>-</span>
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
                                    className="!w-24 disabled:bg-muted dark:disabled:bg-muted-dark disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="flex items-center pt-8">
                             <label htmlFor="no-number-checkbox" className="flex items-center cursor-pointer select-none">
                                <input
                                    id="no-number-checkbox"
                                    type="checkbox"
                                    checked={hasNoNumber}
                                    onChange={(e) => setHasNoNumber(e.target.checked)}
                                    className="sr-only"
                                />
                                <span className={`material-symbols-outlined mr-2 text-2xl transition-colors ${hasNoNumber ? 'text-primary dark:text-primary-dark' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {hasNoNumber ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                                <span className="text-sm text-slate-900 dark:text-slate-50">
                                    No tengo número
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <Input
                        id="complement-input"
                        label="Complemento dirección"
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Ej. Torre 7, apto 3, ubicación, etc."
                    />
                </div>

                <div className="mt-12 text-center space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
                    <Button onClick={handleContinue} disabled={!isFormValid}>
                        Continuar
                    </Button>
                    <Button onClick={onBack} variant="secondary" icon={<ArrowLeftIcon className="w-5 h-5"/>}>
                        Volver
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default TransportScreen;