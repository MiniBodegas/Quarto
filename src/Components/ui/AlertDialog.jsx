import React from 'react';
import Modal from './Modal';
import Button from './Button';

const AlertDialog = ({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    type = 'info', // 'success', 'error', 'warning', 'info'
    buttonText = 'Aceptar'
}) => {
    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check_circle',
                    iconBg: 'bg-green-100',
                    iconText: 'text-green-600',
                    border: 'border-green-200',
                    bgColor: 'bg-green-50',
                };
            case 'error':
                return {
                    icon: 'error',
                    iconBg: 'bg-red-100',
                    iconText: 'text-red-600',
                    border: 'border-red-200',
                    bgColor: 'bg-red-50',
                };
            case 'warning':
                return {
                    icon: 'warning',
                    iconBg: 'bg-orange-100',
                    iconText: 'text-orange-600',
                    border: 'border-orange-200',
                    bgColor: 'bg-orange-50',
                };
            case 'info':
            default:
                return {
                    icon: 'info',
                    iconBg: 'bg-blue-100',
                    iconText: 'text-blue-600',
                    border: 'border-blue-200',
                    bgColor: 'bg-blue-50',
                };
        }
    };

    const config = getConfig();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {/* Ícono */}
                <div className="flex justify-center">
                    <div className={`p-4 rounded-full ${config.iconBg}`}>
                        <span className={`material-symbols-outlined text-5xl ${config.iconText}`}>
                            {config.icon}
                        </span>
                    </div>
                </div>

                {/* Mensaje */}
                <div className={`p-4 border-2 ${config.border} rounded-lg ${config.bgColor}`}>
                    <p className="text-slate-700 whitespace-pre-line text-center">
                        {message}
                    </p>
                </div>

                {/* Botón */}
                <div className="flex justify-center pt-4 border-t">
                    <Button onClick={onClose} className="px-8">
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertDialog;
