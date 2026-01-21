import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger', // 'danger', 'warning', 'info'
    icon = 'warning',
    requiresTextConfirmation = false,
    confirmationText = 'ELIMINAR',
    isLoading = false
}) => {
    const [inputValue, setInputValue] = React.useState('');
    const [error, setError] = React.useState('');

    const handleConfirm = () => {
        if (requiresTextConfirmation) {
            if (inputValue !== confirmationText) {
                setError(`Debes escribir exactamente "${confirmationText}" para confirmar`);
                return;
            }
        }
        onConfirm();
    };

    const handleClose = () => {
        setInputValue('');
        setError('');
        onClose();
    };

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    iconBg: 'bg-red-100',
                    iconText: 'text-red-600',
                    border: 'border-red-200',
                    buttonBg: 'bg-red-500 hover:bg-red-600',
                };
            case 'warning':
                return {
                    iconBg: 'bg-orange-100',
                    iconText: 'text-orange-600',
                    border: 'border-orange-200',
                    buttonBg: 'bg-orange-500 hover:bg-orange-600',
                };
            case 'info':
                return {
                    iconBg: 'bg-blue-100',
                    iconText: 'text-blue-600',
                    border: 'border-blue-200',
                    buttonBg: 'bg-blue-500 hover:bg-blue-600',
                };
            default:
                return {
                    iconBg: 'bg-gray-100',
                    iconText: 'text-gray-600',
                    border: 'border-gray-200',
                    buttonBg: 'bg-gray-500 hover:bg-gray-600',
                };
        }
    };

    const colors = getColors();

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="space-y-4">
                {/* Ícono */}
                <div className="flex justify-center">
                    <div className={`p-4 rounded-full ${colors.iconBg}`}>
                        <span className={`material-symbols-outlined text-5xl ${colors.iconText}`}>
                            {icon}
                        </span>
                    </div>
                </div>

                {/* Mensaje */}
                <div className={`p-4 border-2 ${colors.border} rounded-lg bg-gray-50`}>
                    <p className="text-slate-700 whitespace-pre-line text-center">
                        {message}
                    </p>
                </div>

                {/* Input de confirmación (si es requerido) */}
                {requiresTextConfirmation && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Para confirmar, escribe: <strong>{confirmationText}</strong>
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={confirmationText}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-600 text-sm mt-2">⚠️ {error}</p>
                        )}
                    </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 ${colors.buttonBg} text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? '⏳ Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
