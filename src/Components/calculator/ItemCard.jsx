import { TrashIcon } from './icons';

const ItemCard = ({ item, onQuantityChange, onRemove }) => {
    const { id, name, width, height, depth, volume, quantity, isCustom } = item;

    const handleDecrement = () => {
        if (quantity > 0) {
            onQuantityChange(id, quantity - 1);
        }
    };

    const handleIncrement = () => {
        onQuantityChange(id, quantity + 1);
    };
    
    const handleInputChange = (e) => {
        const value = parseInt(e.target.value, 10);
        onQuantityChange(id, isNaN(value) ? 0 : value);
    };

    const subtotalVolume = (volume * quantity).toFixed(1);

    return (
        <div className="bg-muted dark:bg-muted-dark p-3 rounded-xl flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-md dark:text-slate-100 leading-tight pr-2">{name}</h3>
                    {isCustom && (
                        <button
                            onClick={() => onRemove(id)}
                            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors flex-shrink-0"
                            aria-label="Eliminar artículo"
                        >
                            <TrashIcon className="text-lg leading-none" />
                        </button>
                    )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <p>Vol: <strong>{volume.toFixed(1)} m³</strong> <span className="opacity-70">({width}x{height}x{depth}m)</span></p>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <button onClick={handleDecrement} className="text-3xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={quantity <= 0}>
                        <span className="material-symbols-outlined">remove_circle</span>
                    </button>
                    <input 
                        type="text"
                        role="spinbutton"
                        aria-valuemin={0}
                        aria-valuenow={quantity}
                        value={quantity}
                        onChange={handleInputChange}
                        className="w-10 text-center bg-transparent font-bold text-base dark:text-slate-100 focus:outline-none"
                    />
                    <button onClick={handleIncrement} className="text-3xl text-slate-400 hover:text-primary dark:hover:text-primary-dark transition-colors">
                        <span className="material-symbols-outlined">add_circle</span>
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-base font-bold dark:text-slate-50">{subtotalVolume} m³</p>
                </div>
            </div>
        </div>
    );
};

export default ItemCard;