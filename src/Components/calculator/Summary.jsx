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
    <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#012E58]">
            Resumen del inventario
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasItems
              ? 'Revisa los artículos seleccionados antes de continuar.'
              : 'Añade artículos para ver el resumen.'}
          </p>
        </div>

        {hasItems && (
          <span className="inline-flex items-center rounded-full bg-[#012E58]/5 px-3 py-1 text-[11px] font-medium text-[#012E58]">
            {totalItems} ítem{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lista de artículos */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent max-h-48 overflow-y-auto">
        {hasItems ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label={`Eliminar ${item.name} del inventario`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Todavía no has agregado ningún artículo.
          </p>
        )}
      </div>

      {/* Artículos totales */}
      <SummaryRow
        label="Artículos totales"
        value={
          <span className="text-2xl font-bold text-[#012E58]">
            {totalItems}
          </span>
        }
      />

      {/* Volumen total */}
      <div className="rounded-2xl border border-slate-100 dark:border-border-dark bg-slate-50/80 dark:bg-muted-dark px-5 py-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
          Volumen total estimado
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold text-[#012E58]">
          {totalVolume.toFixed(1)}{' '}
          <span className="text-xl font-semibold opacity-80">m³</span>
        </p>
      </div>

      {/* Acciones */}
      <div className="pt-1 flex gap-2 justify-between">
        <Button
          variant="danger"
          onClick={onClearAll}
          disabled={!hasItems}
          className="flex-1 !px-3 !py-2"
        >
          Vaciar inventario
        </Button>
         <Button
          onClick={onContinue}
          disabled={!hasItems}
          className="flex-1 !py-2"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default Summary;
