import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { getInvoicesWithUsers } from '../../api';
import { supabase } from '../../supabase';

const AdminInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);

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

    const generateMonthlyInvoices = async () => {
        if (!confirm('¿Estás seguro de generar las facturas del mes actual? Esta acción creará facturas para todos los clientes activos.')) {
            return;
        }

        setIsGenerating(true);
        setError(null);
        const result = {
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            created: []
        };

        try {
            // Obtener fecha actual
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const invoiceDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

            console.log(`[AdminInvoices] Generando facturas para: ${currentYear}-${currentMonth}`);

            // 1. Obtener todos los bookings activos con amount_monthly > 0
            const { data: activeBookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('id, user_id, email, name, amount_monthly, payment_status')
                .gt('amount_monthly', 0)
                .eq('payment_status', 'PENDING');

            if (bookingsError) {
                throw new Error('Error al obtener bookings: ' + bookingsError.message);
            }

            console.log(`[AdminInvoices] Bookings activos encontrados: ${activeBookings?.length || 0}`);

            if (!activeBookings || activeBookings.length === 0) {
                setGenerationResult({
                    success: 0,
                    failed: 0,
                    skipped: 0,
                    message: 'No hay bookings activos con monto mensual configurado'
                });
                setShowResultModal(true);
                return;
            }

            // 2. Para cada booking, verificar si ya tiene factura del mes
            for (const booking of activeBookings) {
                try {
                    // Verificar si ya existe factura para este mes
                    const { data: existingInvoice, error: checkError } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('booking_id', booking.id)
                        .gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
                        .lt('created_at', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
                        .maybeSingle();

                    if (checkError && checkError.code !== 'PGRST116') {
                        throw checkError;
                    }

                    if (existingInvoice) {
                        result.skipped++;
                        console.log(`[AdminInvoices] ⏭️ Factura ya existe para booking ${booking.id}`);
                        continue;
                    }

                    // 3. Crear payment record (factura)
                    const amountInCents = Math.round(booking.amount_monthly * 100);
                    const reference = `QUARTO_${booking.id}_${currentYear}${String(currentMonth).padStart(2, '0')}`;

                    const { data: newPayment, error: paymentError } = await supabase
                        .from('payments')
                        .insert({
                            booking_id: booking.id,
                            user_id: booking.user_id,
                            amount_in_cents: amountInCents,
                            currency: 'COP',
                            status: 'PENDING',
                            wompi_reference: reference,
                            created_at: invoiceDate,
                        })
                        .select()
                        .single();

                    if (paymentError) {
                        throw paymentError;
                    }

                    result.success++;
                    result.created.push({
                        name: booking.name,
                        email: booking.email,
                        amount: booking.amount_monthly,
                        reference: reference
                    });
                    console.log(`[AdminInvoices] ✅ Factura creada: ${reference}`);

                } catch (err) {
                    result.failed++;
                    result.errors.push({
                        booking_id: booking.id,
                        name: booking.name,
                        error: err.message
                    });
                    console.error(`[AdminInvoices] ❌ Error en booking ${booking.id}:`, err);
                }
            }

            // 4. Mostrar resultado
            setGenerationResult(result);
            setShowResultModal(true);

            // 5. Recargar facturas
            if (result.success > 0) {
                await loadInvoices();
            }

        } catch (err) {
            console.error('[AdminInvoices] Error general generando facturas:', err);
            setError('Error generando facturas: ' + err.message);
        } finally {
            setIsGenerating(false);
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
                <div className="flex gap-3">
                    <button
                        onClick={generateMonthlyInvoices}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isGenerating ? 'hourglass_empty' : 'calendar_month'}
                        </span>
                        {isGenerating ? 'Generando...' : 'Generar Facturas del Mes'}
                    </button>
                    <button
                        onClick={loadInvoices}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        {loading ? 'Cargando...' : 'Refrescar'}
                    </button>
                </div>
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

            {/* Modal de Resultado de Generación */}
            {showResultModal && generationResult && (
                <Modal
                    isOpen={showResultModal}
                    onClose={() => {
                        setShowResultModal(false);
                        setGenerationResult(null);
                    }}
                    title="Resultado de Generación de Facturas"
                >
                    <div className="space-y-4">
                        {generationResult.message ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800">{generationResult.message}</p>
                            </div>
                        ) : (
                            <>
                                {/* Resumen */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-green-600">{generationResult.success}</p>
                                        <p className="text-sm text-green-700 mt-1">Creadas</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-yellow-600">{generationResult.skipped}</p>
                                        <p className="text-sm text-yellow-700 mt-1">Omitidas</p>
                                    </div>
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-red-600">{generationResult.failed}</p>
                                        <p className="text-sm text-red-700 mt-1">Fallidas</p>
                                    </div>
                                </div>

                                {/* Facturas creadas */}
                                {generationResult.created && generationResult.created.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">
                                            Facturas Creadas ({generationResult.created.length})
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {generationResult.created.map((item, idx) => (
                                                <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                                    <p className="font-medium text-green-900">{item.name}</p>
                                                    <p className="text-green-700">
                                                        {item.email} - ${item.amount.toLocaleString('es-CO')}
                                                    </p>
                                                    <p className="text-xs text-green-600">{item.reference}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errores */}
                                {generationResult.errors && generationResult.errors.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-red-600 mb-2">
                                            Errores ({generationResult.errors.length})
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {generationResult.errors.map((err, idx) => (
                                                <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                                    <p className="font-medium text-red-900">
                                                        Booking ID: {err.booking_id} - {err.name}
                                                    </p>
                                                    <p className="text-red-700">{err.error}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Botón cerrar */}
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                onClick={() => {
                                    setShowResultModal(false);
                                    setGenerationResult(null);
                                }}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminInvoices;
