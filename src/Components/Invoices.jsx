import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { formatCurrency } from '../utils/formatters';
import Input from './ui/Input';

const InvoicesList = ({ invoices, onUpdateInvoice, onUpdateMultipleInvoices, addNotification }) => {
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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

  const unpaidInvoicesOnScreen = useMemo(() => 
    filteredInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue'),
    [filteredInvoices]
  );
  
  const selectedInvoices = useMemo(() => 
    invoices.filter(inv => selectedIds.has(inv.id)),
    [invoices, selectedIds]
  );

  const selectedTotal = useMemo(() => 
    selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    [selectedInvoices]
  );

  const handleSelect = (invoiceId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allUnpaidIds = unpaidInvoicesOnScreen.map(inv => inv.id);
      setSelectedIds(new Set(allUnpaidIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handlePayClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
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

  const handleConfirmBatchPayment = async () => {
    if (selectedIds.size === 0) return;
    setIsPaying(true);
    try {
        await onUpdateMultipleInvoices(Array.from(selectedIds));
        addNotification('success', `${selectedIds.size} facturas pagadas exitosamente`);
    } catch (error) {
        addNotification('error', 'Error al procesar el pago múltiple.');
    }
    setIsPaying(false);
    setIsBatchModalOpen(false);
    setSelectedIds(new Set());
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
  
  const handleDownloadInvoice = (invoice) => {
    let content = `FACTURA QUARTO\n`;
    content += `====================\n\n`;
    content += `Número de Factura: ${invoice.invoice_number}\n`;
    content += `Fecha de Emisión: ${invoice.issue_date}\n`;
    content += `Fecha de Vencimiento: ${invoice.due_date}\n`;
    content += `Estado: ${invoice.status}\n\n`;
    content += `Detalles:\n`;
    content += `--------------------\n`;
    invoice.items.forEach(item => {
        content += `${item.description.padEnd(40)} ${formatCurrency(item.amount)}\n`;
    });
    content += `--------------------\n`;
    content += `TOTAL A PAGAR: ${formatCurrency(invoice.amount)}\n\n`;
    content += `Gracias por su negocio.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Factura-${invoice.invoice_number}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addNotification('info', 'Factura descargada');
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
          
          {selectedIds.size > 0 && (
            <div className="shrink-0">
              <Button onClick={() => setIsBatchModalOpen(true)}>
                  Pagar seleccionadas ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                    <input 
                        type="checkbox"
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        onChange={handleSelectAll}
                        checked={unpaidInvoicesOnScreen.length > 0 && selectedIds.size === unpaidInvoicesOnScreen.length}
                        disabled={unpaidInvoicesOnScreen.length === 0}
                        aria-label="Seleccionar todas las facturas no pagadas"
                    />
                </th>
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
                <tr key={invoice.id} className={`${selectedIds.has(invoice.id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                  <td className="px-6 py-4">
                     {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                         <input 
                            type="checkbox"
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            checked={selectedIds.has(invoice.id)}
                            onChange={() => handleSelect(invoice.id)}
                            aria-label={`Seleccionar factura ${invoice.invoice_number}`}
                         />
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{invoice.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.due_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">{formatCurrency(invoice.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handleDownloadInvoice(invoice)}
                        >
                            Descargar
                        </Button>
                        {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                          <Button onClick={() => handlePayClick(invoice)}>Pagar Ahora</Button>
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
                <div key={invoice.id} className={`bg-background/80 p-4 rounded-lg border ${selectedIds.has(invoice.id) ? 'border-primary bg-blue-50' : 'border-border'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-text-primary truncate pr-2">{invoice.invoice_number}</span>
                        <div className="flex items-center gap-3 shrink-0">
                            {getStatusBadge(invoice.status)}
                            {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                                    checked={selectedIds.has(invoice.id)}
                                    onChange={() => handleSelect(invoice.id)}
                                    aria-label={`Seleccionar factura ${invoice.invoice_number}`}
                                />
                            )}
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
                        <Button 
                            variant="secondary" 
                            onClick={() => handleDownloadInvoice(invoice)} 
                            className="flex-1"
                        >
                            Descargar
                        </Button>
                        {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                            <Button 
                                onClick={() => handlePayClick(invoice)} 
                                className="flex-1"
                            >
                                Pagar Ahora
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

      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Confirmar Pago Múltiple">
        {selectedInvoices.length > 0 && (
          <div className="space-y-4">
            <p className="text-text-secondary">Estás a punto de pagar <span className="font-bold text-text-primary">{selectedInvoices.length} facturas</span>.</p>
            
            <div className="max-h-40 overflow-y-auto bg-background p-3 rounded-md border border-border space-y-2 text-sm">
                {selectedInvoices.map(inv => (
                    <div key={inv.id} className="flex justify-between">
                        <span>Factura #{inv.invoice_number}</span>
                        <span className="font-medium">{formatCurrency(inv.amount)}</span>
                    </div>
                ))}
            </div>

            <div className="bg-background p-4 rounded-md">
              <div className="flex justify-between text-lg">
                <span className="text-text-secondary">Importe Total a Pagar:</span>
                <span className="font-bold text-text-primary">{formatCurrency(selectedTotal)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Al hacer clic en confirmar, todas las facturas seleccionadas se marcarán como pagadas.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsBatchModalOpen(false)} disabled={isPaying}>Cancelar</Button>
              <Button onClick={handleConfirmBatchPayment} disabled={isPaying}>
                {isPaying ? 'Procesando...' : `Confirmar Pago (${formatCurrency(selectedTotal)})`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesList;
