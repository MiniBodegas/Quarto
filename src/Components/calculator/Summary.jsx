import { TrashIcon } from './icons';
import { Button, SummaryRow } from '../index';

const Summary = ({
  totalVolume,
  totalItems,
  selectedItems,
  onContinue,
  onClearAll,
  onRemoveItem,
}) => {
  const hasItems = selectedItems.length > 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-2xl font-bold text-center text-[#074BED]">Resumen total</h2>

      <div className="border-t border-b border-slate-200 my-4">
        {hasItems ? (
          <div className="max-h-48 overflow-y-auto py-2">
            <ul className="space-y-2">
              {selectedItems.map((item) => {
                const qty = item.quantity ?? 0;
                const hasVolume =
                  typeof item.volume === 'number' && !Number.isNaN(item.volume);
                const totalItemVolume = hasVolume
                  ? (item.volume * qty).toFixed(1)
                  : null;

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-[#012E58]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 text-[11px] text-[#012E58]/80">
                        x{qty}
                        {totalItemVolume && (
                          <>
                            {' '}
                            · {totalItemVolume} m³
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                      aria-label={`Eliminar ${item.name} del inventario`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-center text-[#012E58] py-4">
            Añade artículos para ver el resumen.
          </p>
        )}
      </div>

      <SummaryRow
        label="Artículos totales:"
        value={
          <span className="text-2xl font-bold text-[#012E58]">
            {totalItems}
          </span>
        }
      />

      <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-[#012E58] mb-1">
          Volumen total estimado
        </p>
        <p className="text-4xl font-extrabold text-[#012E58]">
          {totalVolume.toFixed(1)}{' '}
          <span className="text-2xl font-semibold opacity-80 text-[#012E58]">
            m³
          </span>
        </p>
      </div>

      <div className="pt-1 flex gap-2 justify-between">
        <Button
          onClick={onContinue}
          disabled={!hasItems}
          className="flex-1 !py-2"
        >
          Continuar
        </Button>
        <Button
          variant="danger"
          onClick={onClearAll}
          disabled={!hasItems}
          className="flex-1 !px-3 !py-2"
        >
          Vaciar inventario
        </Button>
      </div>
    </div>
  );
};

export default Summary;
