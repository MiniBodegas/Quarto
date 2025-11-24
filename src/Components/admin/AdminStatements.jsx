import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

const AdminStatements = ({ invoices, companyProfiles }) => {
    const [selectedClientId, setSelectedClientId] = useState('');

    const selectedClient = useMemo(() => {
        return companyProfiles.find(c => c.id === selectedClientId);
    }, [selectedClientId, companyProfiles]);

    const clientInvoices = useMemo(() => {
        if (!selectedClientId) return [];
        return invoices.filter(inv => inv.company_id === selectedClientId)
            .sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
    }, [selectedClientId, invoices]);

    const statementData = useMemo(() => {
        if (!selectedClient || clientInvoices.length === 0) return { totalBilled: 0, totalPaid: 0, currentBalance: 0 };

        const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid');
        const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        
        const unpaidAmount = clientInvoices
            .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const currentBalance = unpaidAmount - selectedClient.account_credit;

        return { totalBilled, totalPaid, currentBalance };
    }, [clientInvoices, selectedClient]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Estado de Cuenta por Cliente</h1>
                <p className="text-text-secondary mt-1">Selecciona un cliente para ver su resumen financiero y su historial.</p>
            </div>

            <Card className="mb-8">
                <label htmlFor="client-selector" className="block text-sm font-medium text-text-secondary mb-1">Seleccionar Cliente</label>
                <select
                    id="client-selector"
                    className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                >
                    <option value="" disabled>-- Elige un cliente --</option>
                    {companyProfiles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </Card>

            {selectedClient ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <h3 className="text-lg text-text-secondary">Total Facturado</h3>
                            <p className="text-3xl font-bold text-text-primary">{formatCurrency(statementData.totalBilled)}</p>
                        </Card>
                        <Card>
                            <h3 className="text-lg text-text-secondary">Total Pagado</h3>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(statementData.totalPaid)}</p>
                        </Card>
                        <Card>
                            <h3 className="text-lg text-text-secondary">Saldo a Favor</h3>
                            <p className="text-3xl font-bold text-primary">{formatCurrency(selectedClient.account_credit)}</p>
                        </Card>
                        <Card>
                            <h3 className="text-lg text-text-secondary">Saldo Pendiente Actual</h3>
                            <p className={`text-3xl font-bold ${statementData.currentBalance > 0 ? 'text-red-600' : 'text-text-primary'}`}>
                                {formatCurrency(statementData.currentBalance > 0 ? statementData.currentBalance : 0)}
                            </p>
                        </Card>
                    </div>

                    <Card>
                        <h2 className="text-xl font-semibold mb-4 text-text-primary">Historial de Transacciones de {selectedClient.name}</h2>
                        <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Importe</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {clientInvoices.map(invoice => (
                                        <tr key={invoice.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.issue_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">Factura #{invoice.invoice_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-text-primary">{formatCurrency(invoice.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                 {invoice.status === 'paid' ? <span className="text-green-600">Pagada</span> : <span className="text-red-600">Pendiente</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {clientInvoices.length === 0 && (
                                <p className="text-center text-text-secondary py-8">Este cliente no tiene facturas registradas.</p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12 text-text-secondary">
                        <p>Por favor, selecciona un cliente para ver su estado de cuenta.</p>
                    </div>
                </Card>
            )}

        </div>
    );
};

export default AdminStatements;
