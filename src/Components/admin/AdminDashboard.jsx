import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

const AdminDashboard = ({ companyProfiles, invoices, storageUnits }) => {
    
    const stats = useMemo(() => {
        const totalClients = companyProfiles.length;
        
        const totalOutstanding = invoices
            .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const occupiedUnits = storageUnits.filter(unit => unit.status === 'occupied').length;
        const totalUnits = storageUnits.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRevenue = invoices
            .filter(inv => inv.status === 'paid' && new Date(inv.issue_date) >= thirtyDaysAgo)
            .reduce((sum, inv) => sum + inv.amount, 0);

        return { totalClients, totalOutstanding, occupiedUnits, totalUnits, occupancyRate, recentRevenue };
    }, [companyProfiles, invoices, storageUnits]);

    const recentPaidInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.status === 'paid')
            .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
            .slice(0, 5);
    }, [invoices]);

    const getCompanyName = (companyId) => {
        return companyProfiles.find(c => c.id === companyId)?.name || 'N/A';
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Dashboard General</h1>
                <p className="text-text-secondary mt-1">Un resumen del estado actual de su operación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
                           <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Clientes Activos</p>
                            <p className="text-2xl font-bold text-text-primary">{stats.totalClients}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                           <span className="material-symbols-outlined">request_quote</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Deuda Pendiente</p>
                            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalOutstanding)}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                           <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Ingresos (Últimos 30 días)</p>
                            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.recentRevenue)}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                           <span className="material-symbols-outlined">warehouse</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Ocupación de Bodegas</p>
                            <p className="text-2xl font-bold text-text-primary">{stats.occupiedUnits} / {stats.totalUnits} <span className="text-base font-normal">({stats.occupancyRate.toFixed(1)}%)</span></p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-8">
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Actividad Reciente</h2>
                     <p className="text-sm text-text-secondary mb-4">Últimos pagos registrados en el sistema.</p>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Factura #</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                             <tbody className="bg-card divide-y divide-border">
                                {recentPaidInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{getCompanyName(invoice.company_id)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{invoice.invoice_number}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">{formatCurrency(invoice.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {recentPaidInvoices.length === 0 && (
                            <p className="text-center text-text-secondary py-8">No hay pagos recientes registrados.</p>
                        )}
                    </div>
                </Card>
            </div>

        </div>
    )
};

export default AdminDashboard;