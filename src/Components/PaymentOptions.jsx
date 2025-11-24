import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Spinner from './ui/Spinner';

const PaymentOptions = ({ user, onPrepayment, onSetupAutomaticPayment, onDisableAutomaticPayment }) => {
  const [isPrepaymentModalOpen, setIsPrepaymentModalOpen] = useState(false);
  const [isAutoPayModalOpen, setIsAutoPayModalOpen] = useState(false);
  const [isDisableAutoPayModalOpen, setIsDisableAutoPayModalOpen] = useState(false);
  
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handlePrepaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(prepaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSaving(true);
    await onPrepayment(amount);
    setIsSaving(false);
    setIsPrepaymentModalOpen(false);
    setPrepaymentAmount('');
  };

  const handleAutoPaySubmit = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 4) return; // Simple validation

    setIsSaving(true);
    await onSetupAutomaticPayment({ last4: cardNumber.slice(-4) });
    setIsSaving(false);
    setIsAutoPayModalOpen(false);
    setCardNumber('');
  };

  const handleDisableAutoPay = async () => {
    setIsSaving(true);
    await onDisableAutomaticPayment();
    setIsSaving(false);
    setIsDisableAutoPayModalOpen(false);
  }

  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Opciones de Pago Avanzado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Pago Adelantado</h3>
                    <p className="text-text-secondary mb-4">Añade crédito a tu cuenta para cubrir futuras facturas automáticamente. ¡Simplifica tu contabilidad y olvídate de las fechas de vencimiento!</p>
                </div>
                <Button onClick={() => setIsPrepaymentModalOpen(true)}>Realizar un Pago Adelantado</Button>
            </Card>

            <Card className="flex flex-col">
                <div className="flex-1">
                    {user.has_automatic_payment ? (
                        <>
                            <h3 className="text-xl font-semibold text-green-600 mb-2">Cobro Automático Activado</h3>
                            <p className="text-text-secondary mb-1">Tus pagos se procesarán automáticamente con la tarjeta que termina en <span className="font-bold text-text-primary">•••• {user.automatic_payment_card_last4}</span>.</p>
                             <p className="text-sm text-green-700 font-medium">Estás disfrutando de un 5% de descuento en tus facturas.</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-semibold text-text-primary mb-2">Activar Cobro Automático</h3>
                            <p className="text-text-secondary mb-4">Registra tu tarjeta de crédito y deja que nosotros nos encarguemos de los pagos. <span className="font-bold text-primary">¡Obtén un 5% de descuento</span> en todas tus facturas futuras!</p>
                        </>
                    )}
                </div>
                 {user.has_automatic_payment ? (
                    <Button variant="secondary" onClick={() => setIsDisableAutoPayModalOpen(true)}>Administrar Cobro Automático</Button>
                ) : (
                    <Button onClick={() => setIsAutoPayModalOpen(true)}>Configurar Ahora</Button>
                )}
            </Card>
        </div>

        {/* Prepayment Modal */}
        <Modal isOpen={isPrepaymentModalOpen} onClose={() => setIsPrepaymentModalOpen(false)} title="Realizar Pago Adelantado">
            <form onSubmit={handlePrepaymentSubmit} className="space-y-4">
                <Input
                    label="Monto a Pagar por Adelantado (COP)"
                    id="prepaymentAmount"
                    type="number"
                    value={prepaymentAmount}
                    onChange={(e) => setPrepaymentAmount(e.target.value)}
                    required
                    placeholder="Ej: 500000"
                />
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsPrepaymentModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving || !prepaymentAmount}>
                        {isSaving ? <Spinner size="sm" /> : 'Confirmar Pago'}
                    </Button>
                </div>
            </form>
        </Modal>

        {/* Auto-Pay Setup Modal */}
        <Modal isOpen={isAutoPayModalOpen} onClose={() => setIsAutoPayModalOpen(false)} title="Configurar Cobro Automático">
             <form onSubmit={handleAutoPaySubmit} className="space-y-4">
                <p className="text-sm text-text-secondary">Ingresa los datos de tu tarjeta. Por tu seguridad, esta información es simulada y no se guardará.</p>
                <Input label="Número de Tarjeta" id="cardNumber" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="•••• •••• •••• 4242" required />
                {/* Campos simulados adicionales */}
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha de Exp." id="cardExpiry" placeholder="MM/YY" />
                    <Input label="CVC" id="cardCVC" placeholder="123" />
                </div>
                <div className="!mt-6 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-primary">Recuerda: Al activar el cobro automático, recibirás un <span className="font-bold">5% de descuento</span> en tus próximas facturas.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsAutoPayModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving || cardNumber.length < 10}>
                        {isSaving ? <Spinner size="sm" /> : 'Guardar y Activar'}
                    </Button>
                </div>
            </form>
        </Modal>
        
        {/* Disable Auto-Pay Modal */}
        <Modal isOpen={isDisableAutoPayModalOpen} onClose={() => setIsDisableAutoPayModalOpen(false)} title="Administrar Cobro Automático">
            <div>
                <p className="text-text-secondary mb-4">
                    ¿Estás seguro de que deseas desactivar el cobro automático para la tarjeta que termina en <span className="font-bold text-text-primary">•••• {user.automatic_payment_card_last4}</span>? Perderás el 5% de descuento en tus futuras facturas.
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsDisableAutoPayModalOpen(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDisableAutoPay} disabled={isSaving}>
                        {isSaving ? <Spinner size="sm" /> : 'Sí, Desactivar'}
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default PaymentOptions;