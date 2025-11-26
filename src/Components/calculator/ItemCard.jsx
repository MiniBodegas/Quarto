import { TrashIcon } from '../calculator/icons';

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
        <div className="bg-muted dark:bg-muted-dark p-3 rounded-xl flex flex-col justify-between text-[#012E58]">
            <div>
                <div className="flex items-start justify-center mb-1.5">
                    <h3 className="text-md leading-tight pr-2">{name}</h3>
                    {isCustom && (
                        <button
                            onClick={() => onRemove(id)}
                            className="p-1 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
                            aria-label="Eliminar artículo"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="text-xs opacity-80 mb-2">
                    <p>Vol: <strong>{volume.toFixed(1)} m³</strong> <span className="opacity-70">({width}x{height}x{depth}m)</span></p>
                </div>
            </div>
            <div className="flex items-center justify-center ">
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={handleDecrement} 
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={quantity <= 0}
                        aria-label="Quitar uno"
                    >
                        <i className="material-symbols-outlined text-[#012E58] text-2xl">remove_circle</i>
                    </button>
                    <input 
                        type="text"
                        role="spinbutton"
                        aria-valuemin={0}
                        aria-valuenow={quantity}
                        value={quantity}
                        onChange={handleInputChange}
                        className="w-10 text-center bg-transparent font-bold text-base focus:outline-none"
                    />
                    <button 
                        onClick={handleIncrement} 
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        aria-label="Agregar uno"
                    >
                        <i className="material-symbols-outlined text-[#012E58] text-2xl">add_circle</i>
                    </button>
                </div>
                <p className="text-base font-bold">{subtotalVolume} m³</p>
            </div>
        </div>
    );
};

export default ItemCard;