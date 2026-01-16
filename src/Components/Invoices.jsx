import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { formatCurrency } from '../utils/formatters';
import Input from './ui/Input';

const InvoicesList = ({ invoices, onUpdateInvoice, onUpdateMultipleInvoices, addNotification }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const sortedInvoices = useMemo(() => 
    [...invoices].sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    let results = sortedInvoices;

    if (filter === 'paid') {
      results = results.filter(inv => inv.status === 'paid');
    } else if (filter === 'unpaid') {
      results = results.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
    }

    if (startDate) {
        results = results.filter(inv => inv.issue_date >= startDate);
    }
    if (endDate) {
        results = results.filter(inv => inv.issue_date <= endDate);
    }
    
    return results;
  }, [sortedInvoices, filter, startDate, endDate]);

  const handlePayClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };
  
  // ✅ Nueva función para pagar con Wompi
  const handlePayWithWompi = (invoice) => {
    console.log('[Invoices] Iniciando pago con Wompi para factura:', invoice.id);
    
    // Construir datos para Wompi
    const wompiData = {
      reference: invoice.reference || `QUARTO_${invoice.id}_${Date.now()}`,
      amountInCents: Math.round(invoice.amount * 100),
      currency: 'COP',
      bookingId: invoice.id,
      meta: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number || invoice.id,
      }
    };
    
    // Guardar en localStorage para que PaymentScreen lo use
    localStorage.setItem('quarto_pending_payment', JSON.stringify(wompiData));
    
    // Navegar a la pantalla de pago
    navigate('/payment');
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
        await onUpdateInvoice(selectedInvoice);
        addNotification('success', `Factura #${selectedInvoice.invoice_number} pagada exitosamente`);
    } catch (error) {
        addNotification('error', 'Error al procesar el pago. Inténtelo de nuevo.');
    }
    setIsPaying(false);
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pagada</span>;
      case 'unpaid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">No Pagada</span>;
      case 'overdue':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Vencida</span>;
      default:
        return null;
    }
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-text-primary">Facturas</h1>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4 pb-4 border-b border-border">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div>
                <span className="block text-sm font-medium text-text-secondary mb-1">Estado</span>
                <div className="flex justify-start">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}>Todas</button>
                  <button onClick={() => setFilter('unpaid')} className={`px-4 py-2 text-sm font-medium ${filter === 'unpaid' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}>No Pagadas</button>
                  <button onClick={() => setFilter('paid')} className={`px-4 py-2 text-sm font-medium ${filter === 'paid' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}>Pagadas</button>
                </div>
            </div>
            <div className="flex items-end gap-4">
                <Input 
                    label="Desde"
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <Input 
                    label="Hasta"
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Factura #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha de Emisión</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha de Vencimiento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Importe</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{invoice.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.due_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">{formatCurrency(invoice.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                          <>
                            <Button 
                              onClick={() => handlePayWithWompi(invoice)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              💳 Pagar con Wompi
                            </Button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
            {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="bg-background/80 p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-text-primary truncate pr-2">{invoice.invoice_number}</span>
                        <div className="flex items-center gap-3 shrink-0">
                            {getStatusBadge(invoice.status)}
                        </div>
                    </div>
                    <div className="text-sm text-text-secondary space-y-1 mb-4">
                        <div className="flex justify-between">
                            <span>Importe:</span>
                            <span className="font-medium text-text-primary">{formatCurrency(invoice.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Emisión:</span>
                            <span>{invoice.issue_date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Vencimiento:</span>
                            <span>{invoice.due_date}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                            <Button 
                                onClick={() => handlePayWithWompi(invoice)} 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                💳 Pagar con Wompi
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-10 text-text-secondary">
            <p>No se encontraron facturas para este filtro.</p>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Pagar Factura ${selectedInvoice?.invoice_number}`}>
        {selectedInvoice && (
          <div className="space-y-4">
            <p className="text-text-secondary">Estás a punto de pagar la factura <span className="font-bold text-text-primary">{selectedInvoice.invoice_number}</span>.</p>
            <div className="bg-background p-4 rounded-md">
              <div className="flex justify-between text-lg">
                <span className="text-text-secondary">Importe Total a Pagar:</span>
                <span className="font-bold text-text-primary">{formatCurrency(selectedInvoice.amount)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Esto ejecutará el pago. Al hacer clic en confirmar, esta factura se marcará como pagada en la base de datos.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isPaying}>Cancelar</Button>
              <Button onClick={handleConfirmPayment} disabled={isPaying}>
                {isPaying ? 'Procesando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesList;
