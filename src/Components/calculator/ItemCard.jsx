import React, { useState } from 'react';
import { TrashIcon } from '../calculator/icons';

const ItemCard = ({ item, onQuantityChange, onRemove }) => {
  const [isHovered, setHovered] = useState(false);
  const isSelected = (item?.quantity ?? 0) > 0;

  const {
    id,
    name,
    width,
    height,
    depth,
    volume,
    quantity = 0,
    isCustom,
  } = item;

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
    onQuantityChange(id, Number.isNaN(value) ? 0 : value);
  };

  const subtotalVolume =
    typeof volume === 'number' && !Number.isNaN(volume)
      ? (volume * quantity).toFixed(1)
      : '0.0';

  const baseVolume =
    typeof volume === 'number' && !Number.isNaN(volume)
      ? volume.toFixed(1)
      : '0.0';

  const cardBorder =
    isSelected
      ? 'border-[#2563eb]'
      : isHovered
      ? 'border-slate-300'
      : 'border-slate-200';

  const cardShadow = isSelected ? 'shadow-[0_0_0_2px_rgba(37,99,235,0.18)]' : '';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        flex flex-col justify-between rounded-2xl border bg-white
        px-4 py-3 sm:px-5 sm:py-4 transition-all duration-150
        ${cardBorder} ${cardShadow}
      `}
    >
      {/* HEADER */}
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-[#012E58]">
              {name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                Vol: {baseVolume} m³
              </span>
              <span className="text-[11px] text-slate-400">
                ({width} x {height} x {depth} m)
              </span>
            </div>
          </div>

          {isCustom && (
            <button
              onClick={() => onRemove(id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Eliminar artículo personalizado"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* CANTIDAD + VOLUMEN */}
      <div className="mt-2 flex items-center justify-between gap-3">
        {/* Stepper */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            Cantidad
          </span>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            <button
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#012E58] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={quantity <= 0}
              aria-label="Quitar uno"
            >
              <i className="material-symbols-outlined text-xl">remove</i>
            </button>
            <input
              type="text"
              role="spinbutton"
              aria-valuemin={0}
              aria-valuenow={quantity}
              value={quantity}
              onChange={handleInputChange}
              className="w-10 border-none bg-transparent text-center text-sm font-semibold text-slate-800 focus:outline-none"
            />
            <button
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#012E58] text-white hover:bg-[#001b33] transition-colors"
              aria-label="Agregar uno"
            >
              <i className="material-symbols-outlined text-xl">add</i>
            </button>
          </div>
        </div>

        {/* Volumen total */}
        <div className="flex flex-col items-end">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            Volumen total
          </span>
          <span className="text-sm font-semibold text-[#012E58]">
            {subtotalVolume} m³
          </span>
          {isSelected && (
            <span className="mt-0.5 text-[11px] text-slate-500">
              {quantity} ítem{quantity !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
