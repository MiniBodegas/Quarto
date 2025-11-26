const ConfirmModal = ({ open, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold text-[#012E58] mb-2">¿Vaciar inventario?</h2>
                <p className="text-slate-700 mb-6">
                    Se eliminarán los artículos personalizados y las cantidades de los artículos predefinidos se restablecerán a cero.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        className="px-4 py-2 rounded bg-slate-200 text-[#012E58] font-semibold hover:bg-slate-300"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-[#012E58] text-white font-semibold hover:bg-[#014080]"
                        onClick={onConfirm}
                    >
                        Vaciar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;