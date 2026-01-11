import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { getUsersWithBookings } from '../../api';

const UsersWithBookings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('totalVolume'); // 'totalVolume', 'totalMonthly', 'name'

  useEffect(() => {
    loadUsersWithBookings();
  }, []);

  const loadUsersWithBookings = async () => {
    try {
      setLoading(true);
      const result = await getUsersWithBookings();
      
      if (result.success && result.data) {
        setUsers(result.data);
        setError(null);
      } else {
        setError(result.error || 'Error al cargar los datos');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'totalVolume') {
      return b.totalVolume - a.totalVolume;
    } else if (sortBy === 'totalMonthly') {
      return b.totalMonthly - a.totalMonthly;
    } else if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  const totalMetraje = users.reduce((sum, u) => sum + u.totalVolume, 0);
  const totalMonthlyRevenue = users.reduce((sum, u) => sum + u.totalMonthly, 0);

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
        <h1 className="text-3xl font-bold text-text-primary">Usuarios con Reservas</h1>
        <p className="text-text-secondary mt-1">Metraje en uso y cuota mensual por usuario.</p>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Usuarios</p>
              <p className="text-2xl font-bold text-text-primary">{users.length}</p>
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
              <p className="text-2xl font-bold text-text-primary">{totalMetraje.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-text-primary">
                ${totalMonthlyRevenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text-primary">Listado de Usuarios</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-secondary">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="totalVolume">Metraje (Mayor)</option>
              <option value="totalMonthly">Cuota Mensual (Mayor)</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">person</span>
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
                  Cuota Mensual
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user, idx) => (
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
                      <span className="text-sm font-semibold text-green-600">
                        {user.totalVolume.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm text-text-secondary">
                        {user.totalItems}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-purple-600">
                        ${user.totalMonthly.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                        {user.bookingCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.paymentStatus === 'APPROVED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.paymentStatus === 'APPROVED' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">
                    No hay usuarios con reservas registrados
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

export default UsersWithBookings;
