import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { getInvoicesWithUsers } from '../../api';

const AdminInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const result = await getInvoicesWithUsers();
            
            console.log("[AdminInvoices] ✅ DATOS RECIBIDOS DEL BACKEND:");
            console.log("Total:", result.data?.length);
            if (result.data && result.data.length > 0) {
              console.log("PRIMEROS 3:");
              result.data.slice(0, 3).forEach((b, idx) => {
                console.log(`  [${idx}] ID: ${b.id}, Name: ${b.name}, payment_status: "${b.payment_status}"`);
              });
            }
            
            if (result.success && result.data) {
                // Mapear datos de la BD a formato esperado por el componente
                const mappedInvoices = result.data.map(booking => ({
                    id: booking.id,
                    name: booking.name,
                    email: booking.email,
                    phone: booking.phone,
                    company_name: booking.company_name,
                    amount: booking.amount_monthly,
                    totalAmount: booking.amount_total,
                    status: booking.payment_status,
                    createdDate: booking.created_at,
                    volume: booking.total_volume,
                    items: booking.total_items
                }));
                
                console.log("[AdminInvoices] ✅ DATOS MAPEADOS:");
                console.log("Total mapeados:", mappedInvoices.length);
                if (mappedInvoices.length > 0) {
                  console.log("PRIMEROS 3 MAPEADOS:");
                  mappedInvoices.slice(0, 3).forEach((inv, idx) => {
                    console.log(`  [${idx}] Name: ${inv.name}, status: "${inv.status}"`);
                  });
                }
                
                setInvoices(mappedInvoices);
                setError(null);
            } else {
                setError(result.error || 'Error al cargar las facturas');
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pagada</span>;
            case 'PENDING':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
            case 'DECLINED':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rechazada</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const filteredAndSortedInvoices = useMemo(() => {
        let filtered = invoices.filter(inv => 
            statusFilter === 'all' || inv.status === statusFilter
        );

        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.createdDate) - new Date(a.createdDate);
            } else if (sortBy === 'amount') {
                return b.amount - a.amount;
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            return 0;
        });

        return filtered;
    }, [invoices, statusFilter, sortBy]);

    const stats = useMemo(() => {
        const totalInvoices = invoices.length;
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const paidAmount = invoices
            .filter(inv => inv.status === 'APPROVED')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const pendingAmount = invoices
            .filter(inv => inv.status === 'PENDING')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        return { totalInvoices, totalAmount, paidAmount, pendingAmount };
    }, [invoices]);

    if (loading) {
        return (
            <Card className="p-8 flex items-center justify-center">
                <Spinner />
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Registro de Facturas</h1>
                    <p className="text-text-secondary mt-1">Consulta y filtra el historial completo de facturación.</p>
                </div>
                <button
                    onClick={loadInvoices}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {loading ? 'Cargando...' : 'Refrescar'}
                </button>
            </div>

            {error && (
                <Card className="mb-6 p-4 bg-red-50 border border-red-200">
                    <p className="text-red-700">{error}</p>
                </Card>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Total Facturas</p>
                            <p className="text-2xl font-bold text-text-primary">{stats.totalInvoices}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Monto Pagado</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${stats.paidAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Pendiente</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                ${stats.pendingAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                            <span className="material-symbols-outlined">attach_money</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Total Facturado</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ${stats.totalAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabla */}
            <Card>
                <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <h2 className="text-xl font-semibold text-text-primary">Facturas Detalladas</h2>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-text-secondary whitespace-nowrap">Estado:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">Todas</option>
                                <option value="APPROVED">Pagadas</option>
                                <option value="PENDING">Pendientes</option>
                                <option value="DECLINED">Rechazadas</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-text-secondary whitespace-nowrap">Ordenar:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="date">Fecha (Reciente)</option>
                                <option value="amount">Monto (Mayor)</option>
                                <option value="name">Nombre (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Teléfono
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Cuota Mensual
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredAndSortedInvoices.length > 0 ? (
                                filteredAndSortedInvoices.map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{inv.name || 'N/A'}</p>
                                                {inv.company_name && (
                                                    <p className="text-xs text-text-secondary">{inv.company_name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                            {inv.email}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                            {inv.phone || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <span className="text-sm font-semibold text-primary">
                                                ${inv.amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <span className="text-sm text-text-secondary">
                                                ${inv.totalAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                            {new Date(inv.createdDate).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {getStatusBadge(inv.status)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">
                                        No hay facturas con los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminInvoices;
