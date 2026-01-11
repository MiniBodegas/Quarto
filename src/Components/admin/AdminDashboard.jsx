import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { getClientsComplete, getInvoicesWithUsers, getStorageByUser } from '../../api';

const AdminDashboard = () => {
    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [storage, setStorage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            const [clientsRes, invoicesRes, storageRes] = await Promise.all([
                getClientsComplete(),
                getInvoicesWithUsers(),
                getStorageByUser()
            ]);

            if (clientsRes.success) setClients(clientsRes.data || []);
            if (invoicesRes.success) {
                // Mapear datos de la BD a formato esperado
                const mappedInvoices = (invoicesRes.data || []).map(booking => ({
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
                setInvoices(mappedInvoices);
            }
            if (storageRes.success) setStorage(storageRes.data || []);
            
            setError(null);
        } catch (err) {
            setError('Error al cargar datos: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalClients = clients.length;
        const totalVolume = clients.reduce((sum, c) => sum + c.totalVolume, 0);
        const totalItems = clients.reduce((sum, c) => sum + c.totalItems, 0);
        const totalMonthly = clients.reduce((sum, c) => sum + c.totalMonthly, 0);
        
        const paidAmount = invoices
            .filter(inv => inv.status === 'APPROVED')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        const pendingAmount = invoices
            .filter(inv => inv.status === 'PENDING')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const paidClients = clients.filter(c => 
            c.paymentStatus && c.paymentStatus.includes('APPROVED')
        ).length;

        return {
            totalClients,
            totalVolume,
            totalItems,
            totalMonthly,
            paidAmount,
            pendingAmount,
            paidClients,
            totalInvoices: invoices.length
        };
    }, [clients, invoices]);

    const recentInvoices = useMemo(() => {
        return invoices
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .slice(0, 10);
    }, [invoices]);

    const topClients = useMemo(() => {
        return [...clients]
            .sort((a, b) => b.totalMonthly - a.totalMonthly)
            .slice(0, 5);
    }, [clients]);

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
                    <h1 className="text-3xl font-bold text-text-primary">Dashboard General</h1>
                    <p className="text-text-secondary mt-1">Resumen consolidado de toda la operación.</p>
                </div>
                <button
                    onClick={loadDashboardData}
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

            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <span className="material-symbols-outlined">aspect_ratio</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Metraje en Uso (m³)</p>
                            <p className="text-2xl font-bold text-green-600">{stats.totalVolume.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                            <span className="material-symbols-outlined">package_2</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Total Items Guardados</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.totalItems}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                            <span className="material-symbols-outlined">attach_money</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Ingresos Mensuales</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ${stats.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Estadísticas de pago */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Pagado</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${stats.paidAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">{stats.totalInvoices} facturas</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Pendiente de Pago</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                ${stats.pendingAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">Requiere atención</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                            <span className="material-symbols-outlined">verified_user</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Clientes al Día</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.paidClients} / {stats.totalClients}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                {stats.totalClients > 0 ? ((stats.paidClients / stats.totalClients) * 100).toFixed(0) : 0}% de cumplimiento
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Dos columnas: Clientes Top y Actividad Reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clientes */}
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Clientes con Mayor Facturación</h2>
                    <div className="space-y-3">
                        {topClients.length > 0 ? (
                            topClients.map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-text-primary">{client.name || 'N/A'}</p>
                                        {client.company_name && (
                                            <p className="text-xs text-text-secondary">{client.company_name}</p>
                                        )}
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                {client.totalVolume.toFixed(2)} m³
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {client.totalItems} items
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-purple-600">
                                            ${client.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className="text-xs text-text-secondary">cuota mensual</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-text-secondary py-4">No hay clientes</p>
                        )}
                    </div>
                </Card>

                {/* Actividad Reciente */}
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Facturas Recientes</h2>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentInvoices.length > 0 ? (
                            recentInvoices.map((inv, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">{inv.name || 'N/A'}</p>
                                        <p className="text-xs text-text-secondary">
                                            {new Date(inv.createdDate).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                            inv.status === 'APPROVED'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {inv.status === 'APPROVED' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                        <p className="text-sm font-bold text-primary whitespace-nowrap">
                                            ${inv.amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-text-secondary py-4">No hay facturas</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;