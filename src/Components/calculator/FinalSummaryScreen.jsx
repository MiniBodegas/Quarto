import { ArrowLeftIcon } from './icons';
import { calculateStoragePrice } from '../../utils/pricing';
import { Button, ScreenHeader } from '../index';
import { saveStorageRequest } from '../../services/saveStorageRequest';

const FinalSummaryScreen = ({ totalVolume, totalItems, logisticsMethod, transportPrice, onBack, onGoToQuote, onBookService }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const storagePrice = calculateStoragePrice(totalVolume);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 flex-grow flex flex-col justify-center">
                <ScreenHeader 
                    title="Resumen final"
                    subtitle="¡Todo listo! Revisa los detalles de tu plan de almacenamiento."
                />

                <div className="max-w-lg mx-auto w-full">
                    <div className="bg-white dark:bg-white p-6 rounded-2xl space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#012E58] dark:text-[#012E58]">Artículos totales:</span>
                                <span className="text-lg font-bold dark:text-[#012E58]">{totalItems}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#012E58] dark:text-[#012E58]">Volumen total:</span>
                                <span className="text-lg font-bold dark:text-[#012E58]">{totalVolume.toFixed(1)} m³</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#012E58] dark:text-[#012E58]">Método de logística:</span>
                                <span className="text-lg font-bold dark:text-[#012E58]">
                                    {logisticsMethod === 'Recogida' ? 'Recogida' : 'En bodega'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#012E58] dark:text-[#012E58]">Transporte (pago único):</span>
                                <span className="text-lg font-bold dark:text-[#012E58]">
                                    {logisticsMethod === 'Recogida' && transportPrice !== null
                                        ? formatCurrency(transportPrice)
                                        : 'Gratis'}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 text-center bg-muted dark:bg-muted-dark rounded-2xl border border-border dark:border-border-dark">
                            <p className="text-sm font-medium text-muted-foreground dark:text-muted-dark-foreground text-[#012E58] mb-1">
                                Valor mensual estimado
                            </p>

                            <p className="text-4xl font-extrabold dark:text-[#012E58]">
                                {formatCurrency(storagePrice)}
                            </p>

                            {logisticsMethod === 'Recogida' && transportPrice !== null && (
                                <p className="text-xs text-[#012E58] dark:text-[#012E58] mt-1">
                                    + {formatCurrency(transportPrice)} de transporte el primer mes
                                </p>
                            )}
                        </div>
                            <div className="pt-6 space-y-4">
                                <Button
                                    onClick={onBookService}
                                    className="font-extrabold shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    Contratar el servicio
                                </Button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={onBack}
                                        icon={<ArrowLeftIcon className="w-5 h-5" />}
                                    >
                                        Volver
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={onGoToQuote}
                                        icon={<span className="material-symbols-outlined text-lg">mail</span>}
                                    >
                                        Enviar cotización
                                    </Button>
                                </div>
                            </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinalSummaryScreen;
