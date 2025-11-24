import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

const AdminInvoices = ({ invoices, companyProfiles }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');

    const getCompanyName = (companyId) => {
        return companyProfiles.find(c => c.id === companyId)?.name || 'Cliente Desconocido';
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
    
    const sortedInvoices = useMemo(() => 
        [...invoices].sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()),
        [invoices]
    );

    const filteredInvoices = useMemo(() => {
        return sortedInvoices.filter(invoice => {
            const statusMatch = statusFilter === 'all' ||
                (statusFilter === 'paid' && invoice.status === 'paid') ||
                (statusFilter === 'unpaid' && invoice.status === 'unpaid') ||
                (statusFilter === 'overdue' && invoice.status === 'overdue');
            
            const clientMatch = clientFilter === 'all' || invoice.company_id === clientFilter;

            return statusMatch && clientMatch;
        });
    }, [sortedInvoices, statusFilter, clientFilter]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Registro de Facturas</h1>
                <p className="text-text-secondary mt-1">Consulta y filtra el historial completo de facturación.</p>
            </div>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                    <div>
                        <label htmlFor="clientFilter" className="block text-sm font-medium text-text-secondary mb-1">Filtrar por Cliente</label>
                        <select 
                            id="clientFilter" 
                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        >
                            <option value="all">Todos los Clientes</option>
                            {companyProfiles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-text-secondary mb-1">Filtrar por Estado</label>
                        <select 
                            id="statusFilter"
                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="unpaid">No Pagada</option>
                            <option value="overdue">Vencida</option>
                            <option value="paid">Pagada</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Factura #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Emisión</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Vencimiento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Importe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{invoice.invoice_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getCompanyName(invoice.company_id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.issue_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{invoice.due_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">{formatCurrency(invoice.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(invoice.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredInvoices.length === 0 && (
                        <p className="text-center text-text-secondary py-8">No se encontraron facturas con los filtros seleccionados.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AdminInvoices;
