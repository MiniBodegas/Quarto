import { useEffect, useState } from 'react';
import { ArrowLeftIcon, TruckIcon, WarehouseIcon } from './icons';
import {ScreenHeader, Button} from '../index';

const ResultsScreen = ({ totalVolume, totalItems, onBack, onContinue }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);

    useEffect(() => {
        if (totalItems === 0) {
            onBack();
        }
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
        }
    ];

    const handleContinue = (method) => {
        localStorage.setItem('quarto_logistics_method', method);
        // Navega al formulario de dirección/transporte, aunque sea "En bodega"
        onContinue(method);
    };

    const OptionCard = ({ option, isSelected, onSelect }) => {
        const borderClass = isSelected
            ? 'border-2 border-primary dark:border-primary-dark'
            : 'border border-border dark:border-border-dark hover:border-primary dark:hover:border-primary-dark';

        const paddingClass = isSelected ? 'p-[23px]' : 'p-6';

        return (
            <button
                onClick={onSelect}
                className={`w-full h-full text-left rounded-2xl transition-all duration-200 bg-white dark:bg-white ${borderClass} ${paddingClass}`}
                aria-pressed={isSelected}
                aria-label={`Seleccionar opción: ${option.title}`}
            >
                <div className="flex items-start space-x-4 h-full">
                    <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-primary dark:bg-primary-dark' : 'bg-muted dark:bg-muted-dark'}`}>
                        <option.Icon className={`text-4xl transition-colors ${isSelected ? 'text-primary-foreground' : 'text-slate-600 dark:text-slate-400'}`} />
                    </div>
                    <div className="flex flex-col h-full flex-1">
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold dark:text-[#012E58] text-[#012E58]">{option.title}</h3>
                            <p className="mt-1 text-md text-[#012E58] dark:text-[#012E58]">{option.description}</p>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-[#012E58] dark:text-[#012E58]">{option.info}</p>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <ScreenHeader
                title="¿Cómo prefieres guardar tus cosas?"
                subtitle={
                    <>
                        Tu inventario: <strong>{totalItems}</strong> artículos (Total: <strong>{totalVolume.toFixed(1)} m³</strong>)
                    </>
                }
            />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logisticsOptions.map(option => (
                        <OptionCard
                            key={option.id}
                            option={option}
                            isSelected={selectedMethod === option.method}
                            onSelect={() => setSelectedMethod(option.method)}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-12 text-center space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
                 <Button
                    onClick={() => selectedMethod && handleContinue(selectedMethod)}
                    disabled={!selectedMethod}
                >
                    Continuar
                </Button>
                <Button
                    variant="secondary"
                    onClick={onBack}
                    icon={<ArrowLeftIcon className="w-5 h-5" />}
                >
                    Volver al inventario
                </Button>
            </div>
        </div>
    );
};

export default ResultsScreen;