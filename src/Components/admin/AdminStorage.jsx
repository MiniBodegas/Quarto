import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { getStorageByUser } from '../../api';

const AdminStorage = () => {
    const [storage, setStorage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('totalVolume');

    useEffect(() => {
        loadStorage();
    }, []);

    const loadStorage = async () => {
        try {
            setLoading(true);
            const result = await getStorageByUser();
            
            if (result.success && result.data) {
                setStorage(result.data);
                setError(null);
            } else {
                setError(result.error || 'Error al cargar datos de bodegas');
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const sortedStorage = useMemo(() => {
        const sorted = [...storage].sort((a, b) => {
            if (sortBy === 'totalVolume') {
                return b.totalVolume - a.totalVolume;
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            return 0;
        });
        return sorted;
    }, [storage, sortBy]);

    const stats = useMemo(() => {
        const totalVolume = storage.reduce((sum, s) => sum + s.totalVolume, 0);
        const totalItems = storage.reduce((sum, s) => sum + s.totalItems, 0);
        const totalUsers = storage.length;
        const avgVolumePerUser = totalUsers > 0 ? totalVolume / totalUsers : 0;

        return { totalVolume, totalItems, totalUsers, avgVolumePerUser };
    }, [storage]);

    if (loading) {
        return (
            <Card className="p-8 flex items-center justify-center">
                <Spinner />
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestión de Bodegas</h1>
                <p className="text-text-secondary mt-1">Metraje ocupado por usuario.</p>
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
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
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
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Promedio/Usuario</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.avgVolumePerUser.toFixed(2)} m³</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabla de usuarios con metraje */}
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-text-primary">Ocupación por Usuario</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-text-secondary">Ordenar por:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="totalVolume">Metraje (Mayor)</option>
                            <option value="name">Nombre (A-Z)</option>
                        </select>
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
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">aspect_ratio</span>
                                    Metraje (m³)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Reservas
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {sortedStorage.length > 0 ? (
                                sortedStorage.map((user, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{user.name || 'N/A'}</p>
                                                {user.company_name && (
                                                    <p className="text-xs text-text-secondary">{user.company_name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-semibold text-green-600">
                                                    {user.totalVolume.toFixed(2)} m³
                                                </span>
                                                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min((user.totalVolume / stats.totalVolume) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <span className="text-sm text-text-secondary">
                                                {user.totalItems}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                                                {user.bookings.length}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">
                                        No hay usuarios con bodegas ocupadas
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

export default AdminStorage;
