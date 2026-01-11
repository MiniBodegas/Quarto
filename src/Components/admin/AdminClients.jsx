import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { getClientsComplete } from '../../api';

const AdminClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedClient, setExpandedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('totalMonthly');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const result = await getClientsComplete();
            
            if (result.success && result.data) {
                setClients(result.data);
                setError(null);
            } else {
                setError(result.error || 'Error al cargar los clientes');
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSortedClients = useMemo(() => {
        let filtered = clients.filter(client => {
            const searchLower = searchTerm.toLowerCase();
            return (
                client.name?.toLowerCase().includes(searchLower) ||
                client.email?.toLowerCase().includes(searchLower) ||
                client.company_name?.toLowerCase().includes(searchLower)
            );
        });

        filtered.sort((a, b) => {
            if (sortBy === 'totalMonthly') {
                return b.totalMonthly - a.totalMonthly;
            } else if (sortBy === 'totalVolume') {
                return b.totalVolume - a.totalVolume;
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            return 0;
        });

        return filtered;
    }, [clients, searchTerm, sortBy]);

    const stats = useMemo(() => {
        return {
            totalClients: clients.length,
            totalVolume: clients.reduce((sum, c) => sum + c.totalVolume, 0),
            totalItems: clients.reduce((sum, c) => sum + c.totalItems, 0),
            totalMonthly: clients.reduce((sum, c) => sum + c.totalMonthly, 0),
            paidClients: clients.filter(c => c.paymentStatus.includes('APPROVED')).length
        };
    }, [clients]);

    const getPaymentStatusBadge = (statuses) => {
        if (!statuses || statuses.length === 0) return <span className="px-2 text-xs rounded-full bg-gray-100 text-gray-800">Pendiente</span>;
        
        const hasPaid = statuses.includes('APPROVED');
        const hasPending = statuses.includes('PENDING');
        
        if (hasPaid && !hasPending) {
            return <span className="px-2 text-xs rounded-full bg-green-100 text-green-800">Pagado</span>;
        } else if (hasPending && !hasPaid) {
            return <span className="px-2 text-xs rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
        } else {
            return <span className="px-2 text-xs rounded-full bg-blue-100 text-blue-800">Mixto</span>;
        }
    };

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
                    <h1 className="text-3xl font-bold text-text-primary">Gestión de Clientes</h1>
                    <p className="text-text-secondary mt-1">Información completa de usuarios, metraje y facturas.</p>
                </div>
                <button
                    onClick={loadClients}
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Total Clientes</p>
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
                            <p className="text-sm font-medium text-text-secondary">Metraje Total (m³)</p>
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
                            <p className="text-sm font-medium text-text-secondary">Total Items</p>
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
                            <p className="text-2xl font-bold text-purple-600">${stats.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Clientes Pagados</p>
                            <p className="text-2xl font-bold text-green-600">{stats.paidClients} / {stats.totalClients}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabla */}
            <Card>
                <div className="mb-6 space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary">Listado Completo de Clientes</h2>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o empresa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <label className="text-sm font-medium text-text-secondary">Ordenar:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="totalMonthly">Ingresos (Mayor)</option>
                                <option value="totalVolume">Metraje (Mayor)</option>
                                <option value="name">Nombre (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredAndSortedClients.length > 0 ? (
                        filteredAndSortedClients.map((client, idx) => (
                            <div key={idx} className="border border-border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors">
                                <button
                                    onClick={() => setExpandedClient(expandedClient === idx ? null : idx)}
                                    className="w-full text-left p-4 flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-text-primary">{client.name || 'N/A'}</h3>
                                                {client.company_name && (
                                                    <p className="text-xs text-text-secondary">{client.company_name}</p>
                                                )}
                                                <p className="text-xs text-text-secondary">{client.email}</p>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <div className="text-right">
                                                    <p className="text-xs text-text-secondary">Metraje</p>
                                                    <p className="text-sm font-semibold text-green-600">{client.totalVolume.toFixed(2)} m³</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-text-secondary">Cuota Mensual</p>
                                                    <p className="text-sm font-semibold text-primary">${client.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-text-secondary">Estado</p>
                                                    {getPaymentStatusBadge(client.paymentStatus)}
                                                </div>
                                                <span className={`material-symbols-outlined transition-transform ${expandedClient === idx ? 'rotate-180' : ''}`}>
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Detalles expandibles */}
                                {expandedClient === idx && (
                                    <div className="border-t border-border p-4 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Información básica */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary mb-3">Información General</h4>
                                                <dl className="space-y-2 text-sm">
                                                    <div>
                                                        <dt className="text-text-secondary">Teléfono:</dt>
                                                        <dd className="text-text-primary font-medium">{client.phone || 'N/A'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-text-secondary">Tipo:</dt>
                                                        <dd className="text-text-primary font-medium">{client.booking_type === 'company' ? 'Empresa' : 'Persona Natural'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-text-secondary">Reservas Activas:</dt>
                                                        <dd className="text-text-primary font-medium">{client.bookingCount}</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            {/* Resumen de almacenamiento */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary mb-3">Almacenamiento</h4>
                                                <dl className="space-y-2 text-sm">
                                                    <div>
                                                        <dt className="text-text-secondary">Metraje Total:</dt>
                                                        <dd className="text-text-primary font-medium">{client.totalVolume.toFixed(2)} m³</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-text-secondary">Items Guardados:</dt>
                                                        <dd className="text-text-primary font-medium">{client.totalItems}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-text-secondary">Cuota Mensual:</dt>
                                                        <dd className="text-text-primary font-medium">${client.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            {/* Reservas */}
                                            {client.bookings && client.bookings.length > 0 && (
                                                <div className="md:col-span-2">
                                                    <h4 className="text-sm font-semibold text-text-primary mb-3">Reservas</h4>
                                                    <div className="space-y-2">
                                                        {client.bookings.map((booking, bidx) => (
                                                            <div key={bidx} className="bg-white p-2 rounded border border-border text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium">{booking.volume.toFixed(2)} m³ - {booking.items} items</span>
                                                                    <span className={`px-2 rounded ${
                                                                        booking.status === 'APPROVED' 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {booking.status === 'APPROVED' ? 'Pagada' : 'Pendiente'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-text-secondary mt-1">
                                                                    {new Date(booking.createdDate).toLocaleDateString('es-CO')}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-text-secondary">
                            {searchTerm ? 'No hay clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AdminClients;