import { TrashIcon } from './icons';
import {Button,SummaryRow} from '../index';

const Summary = ({ totalVolume, totalItems, selectedItems, onContinue, onClearAll, onRemoveItem }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-border-dark space-y-4">
            <h2 className="text-2xl font-bold text-center dark:text-slate-100">Resumen total</h2>

            <div className="border-t border-b border-slate-200 dark:border-slate-800 my-4">
                {selectedItems.length > 0 ? (
                    <div className="py-2 max-h-48 overflow-y-auto">
                         <ul className="space-y-1 pr-2">
                            {selectedItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center text-sm group">
                                    <span className="text-slate-600 dark:text-slate-400 truncate pr-2">{item.name} <span className="font-medium dark:text-slate-200">x{item.quantity}</span></span>
                                    <button 
                                        onClick={() => onRemoveItem(item.id)}
                                        className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                        aria-label={`Eliminar ${item.name} del inventario`}
                                    >
                                        <TrashIcon className="text-lg leading-none" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">
                        Añade artículos para ver el resumen.
                    </p>
                )}
            </div>
            
            <SummaryRow 
                label="Artículos totales:"
                value={<span className="text-2xl font-bold dark:text-slate-100">{totalItems}</span>}
            />

            <div className="p-6 text-center bg-muted dark:bg-muted-dark rounded-2xl border border-border dark:border-border-dark">
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-dark-foreground mb-1">Volumen total estimado</p>
                <p className="text-4xl font-extrabold dark:text-slate-50">
                    {totalVolume.toFixed(1)} <span className="text-2xl font-semibold opacity-80">m³</span>
                </p>
            </div>

            <div className="space-y-2">
                <Button
                    variant="danger"
                    onClick={onClearAll}
                    disabled={totalItems === 0}
                    icon={<TrashIcon className="text-xl leading-none" />}
                    className="!px-4"
                >
                    Vaciar inventario
                </Button>
                
                <Button
                    onClick={onContinue}
                    disabled={totalItems === 0}
                >
                    Continuar
                </Button>
            </div>
        </div>
    );
};

export default Summary;
