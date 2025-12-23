import { ArrowLeftIcon } from './icons';
import { calculateStoragePrice } from '../../utils/pricing';
import { Button, ScreenHeader } from '../index';
import { saveStorageRequest } from '../../services/saveStorageRequest';

const FinalSummaryScreen = ({ totalVolume, totalItems, logisticsMethod, transportPrice, isAddingToExisting, onBack, onGoToQuote, onBookService }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const storagePrice = calculateStoragePrice(totalVolume);
    console.log(`[FINALSUMMARY] 📦 Volume: ${totalVolume.toFixed(3)}m³ → Storage: $${storagePrice.toLocaleString('es-CO')} + Transport: $${(transportPrice || 0).toLocaleString('es-CO')} = Total: $${(storagePrice + (logisticsMethod === 'Recogida' && transportPrice !== null ? transportPrice : 0)).toLocaleString('es-CO')}`);

    return (
        <div className="min-h-screen flex flex-col ">
            <main className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex-grow flex flex-col pt-8 pb-12">
                <ScreenHeader 
                    title="Resumen final"
                    subtitle="¡Todo listo! Revisa los detalles de tu plan de almacenamiento."
                />

                <div className="max-w-3xl mx-auto w-full mt-4">
                    <div className="bg-white/95 backdrop-blur p-7 sm:p-8 rounded-3xl space-y-7 shadow-xl border border-slate-200/80">
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

                        <div className="p-6 text-center bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3">
                            {/* Desglose de precios */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#012E58]">Almacenamiento mensual:</span>
                                    <span className="font-bold text-[#012E58]">{formatCurrency(storagePrice)}</span>
                                </div>
                                {logisticsMethod === 'Recogida' && transportPrice !== null && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#012E58]">Transporte (pago único):</span>
                                        <span className="font-bold text-[#012E58]">{formatCurrency(transportPrice)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total a pagar hoy */}
                            <div className="border-t border-slate-300 pt-3">
                                <p className="text-sm font-semibold text-[#012E58] mb-1">
                                    {logisticsMethod === 'Recogida' && transportPrice !== null 
                                        ? 'Total primer pago'
                                        : 'Valor mensual estimado'
                                    }
                                </p>
                                <p className="text-4xl font-extrabold text-[#012E58]">
                                    {formatCurrency(
                                        storagePrice + (logisticsMethod === 'Recogida' && transportPrice !== null ? transportPrice : 0)
                                    )}
                                </p>
                                {logisticsMethod === 'Recogida' && transportPrice !== null && (
                                    <p className="text-xs text-[#012E58] mt-1">
                                        Los meses siguientes: {formatCurrency(storagePrice)}/mes
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            {/* CTA principal */}
                            <Button
                                onClick={onBookService}
                                className="w-full !py-3 text-base font-bold shadow-lg hover:shadow-xl"
                            >
                                {isAddingToExisting ? 'Agregar Items a mi Inventario' : 'Contratar el servicio'}
                            </Button>

                            {/* Secundarios alineados en fila */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={onBack}
                                    icon={<ArrowLeftIcon className="w-4 h-4" />}
                                    className="!py-2.5 font-semibold"
                                >
                                    Volver
                                </Button>
                                {!isAddingToExisting && (
                                <Button
                                    variant="outline"
                                    onClick={onGoToQuote}
                                    className="!py-2.5 font-semibold !border-2 !border-[#0B5FFF] !text-[#0B5FFF] hover:!bg-[#0B5FFF]/5"
                                >
                                    Enviar cotización
                                </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinalSummaryScreen;
