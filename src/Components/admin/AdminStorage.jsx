import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import AlertDialog from '../ui/AlertDialog';
import { getStorageByUser, getInventoryByUser } from '../../api';
import { supabase } from '../../supabase';

const AdminStorage = () => {
    const [storage, setStorage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('totalVolume');
    const [selectedUser, setSelectedUser] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [userInventory, setUserInventory] = useState([]);
    const [inventoryError, setInventoryError] = useState(null);
    
    // Estados para el modal de edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        quantity: 0,
        volume: 0,
        image_url: ''
    });
    const [newImageFile, setNewImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Estados para diálogos de confirmación y alertas
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        icon: 'warning',
        requiresTextConfirmation: false,
        confirmationText: '',
        onConfirm: null,
        isLoading: false
    });
    
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        loadStorage();
    }, []);

    const loadStorage = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getStorageByUser();
            
            if (result.success && result.data) {
                setStorage(result.data);
                
                // Si hay un usuario seleccionado, verificar si aún existe
                if (selectedUser) {
                    const userStillExists = result.data.some(
                        user => user.user_id === selectedUser.user_id
                    );
                    
                    if (!userStillExists) {
                        // El usuario fue eliminado, limpiar selección
                        console.log('⚠️ Usuario seleccionado ya no existe, limpiando selección');
                        setSelectedUser(null);
                        setUserInventory([]);
                    }
                }
                
                console.log('✅ Datos de storage actualizados:', result.data.length, 'usuarios');
            } else {
                setError(result.error || 'Error al cargar datos de bodegas');
                setStorage([]);
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            console.error('Error:', err);
            setStorage([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUserInventory = async (user) => {
        try {
            setInventoryLoading(true);
            setInventoryError(null);
            
            if (!user.user_id) {
                setInventoryError('ID de usuario no disponible');
                setUserInventory([]);
                return;
            }
            
            const result = await getInventoryByUser(user.user_id);
            
            if (result.success) {
                setUserInventory(result.data || []);
            } else {
                setInventoryError(result.error || 'Error al cargar inventario');
            }
        } catch (err) {
            setInventoryError('Error de conexión: ' + err.message);
            console.error('Error:', err);
        } finally {
            setInventoryLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        if (selectedUser?.user_id === user.user_id) {
            // Deseleccionar si ya está seleccionado
            setSelectedUser(null);
            setUserInventory([]);
        } else {
            // Seleccionar y cargar inventario
            setSelectedUser(user);
            loadUserInventory(user);
        }
    };

    // Abrir modal de edición
    const handleEditItem = (item) => {
        setEditingItem(item);
        setEditFormData({
            name: item.name || '',
            quantity: item.quantity || 0,
            volume: item.volume || 0,
            image_url: item.image_url || ''
        });
        setImagePreview(item.image_url || null);
        setNewImageFile(null);
        setIsEditModalOpen(true);
    };

    // Cerrar modal de edición
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditFormData({
            name: '',
            quantity: 0,
            volume: 0,
            image_url: ''
        });
        setNewImageFile(null);
        setImagePreview(null);
    };

    // Manejar cambios en el formulario
    const handleEditFormChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Manejar selección de nueva imagen
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImageFile(file);
            // Crear preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Subir nueva imagen a Supabase
    const uploadNewImage = async (itemId) => {
        if (!newImageFile) return editFormData.image_url;

        try {
            setUploadingImage(true);
            const fileExt = newImageFile.name.split('.').pop();
            const fileName = `${editingItem.booking_id}/${itemId}_${Date.now()}.${fileExt}`;

            // Subir archivo
            const { data, error: uploadError } = await supabase.storage
                .from('Inventory')
                .upload(fileName, newImageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('Inventory')
                .getPublicUrl(fileName);

            console.log('✅ Nueva imagen subida:', fileName);
            return urlData.publicUrl;
        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    // Guardar cambios del item
    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            setIsSaving(true);

            // Subir nueva imagen si hay una seleccionada
            let finalImageUrl = editFormData.image_url;
            if (newImageFile) {
                finalImageUrl = await uploadNewImage(editingItem.item_id);
            }

            // Actualizar item en la base de datos
            const { error: updateError } = await supabase
                .from('inventory')
                .update({
                    name: editFormData.name,
                    quantity: parseFloat(editFormData.quantity),
                    volume: parseFloat(editFormData.volume),
                    image_url: finalImageUrl
                })
                .eq('id', editingItem.id);

            if (updateError) throw updateError;

            console.log('✅ Item actualizado exitosamente');

            // Recargar inventario
            await loadUserInventory(selectedUser);

            // Cerrar modal
            handleCloseEditModal();

        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            alert('Error al guardar cambios: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Cancelar servicio (eliminar booking y su inventario)
    const handleCancelService = async (booking) => {
        setConfirmDialog({
            isOpen: true,
            title: '🚫 Cancelar Servicio',
            message: `¿Estás seguro de cancelar el servicio?\n\nBooking ID: ${booking.id}\nUsuario: ${selectedUser.name}\n\nEsto eliminará:\n• El booking\n• Todo el inventario asociado\n• Los pagos relacionados\n\n⚠️ Esta acción NO se puede deshacer.`,
            type: 'warning',
            icon: 'cancel',
            requiresTextConfirmation: false,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                
                try {
                    // 1. Eliminar inventario asociado al booking
                    const { error: inventoryError } = await supabase
                        .from('inventory')
                        .delete()
                        .eq('booking_id', booking.id);

                    if (inventoryError) throw inventoryError;
                    console.log('✅ Inventario eliminado');

                    // 2. Eliminar pagos asociados al booking
                    const { error: paymentsError } = await supabase
                        .from('payments')
                        .delete()
                        .eq('booking_id', booking.id);

                    if (paymentsError) throw paymentsError;
                    console.log('✅ Pagos eliminados');

                    // 3. Eliminar booking
                    const { error: bookingError } = await supabase
                        .from('bookings')
                        .delete()
                        .eq('id', booking.id);

                    if (bookingError) throw bookingError;
                    console.log('✅ Booking eliminado');

                    // Cerrar diálogo de confirmación
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));

                    // Mostrar alerta de éxito
                    setAlertDialog({
                        isOpen: true,
                        title: '✅ Servicio Cancelado',
                        message: 'El servicio ha sido cancelado exitosamente.\n\nEl booking, inventario y pagos han sido eliminados.',
                        type: 'success'
                    });

                    // Recargar datos
                    await loadStorage();
                    setSelectedUser(null);
                    setUserInventory([]);

                } catch (error) {
                    console.error('❌ Error cancelando servicio:', error);
                    
                    // Cerrar diálogo de confirmación
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                    
                    // Mostrar alerta de error
                    setAlertDialog({
                        isOpen: true,
                        title: '❌ Error',
                        message: `Error al cancelar servicio:\n\n${error.message}`,
                        type: 'error'
                    });
                }
            }
        });
    };

    // Eliminar usuario completamente
    const handleDeleteUser = async (user) => {
        setConfirmDialog({
            isOpen: true,
            title: '🗑️ Eliminar Usuario',
            message: `¿Estás COMPLETAMENTE SEGURO de eliminar este usuario?\n\nUsuario: ${user.name}\nEmail: ${user.email}\n\nEsto eliminará:\n• El usuario de la base de datos\n• Todos sus bookings (${user.bookings?.length || 0})\n• Todo su inventario\n• Todos sus pagos\n• Su cuenta de autenticación (si existe)\n\n⚠️⚠️⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️⚠️⚠️`,
            type: 'danger',
            icon: 'delete_forever',
            requiresTextConfirmation: true,
            confirmationText: 'ELIMINAR',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                
                try {
                    // 1. Obtener todos los bookings del usuario
                    const { data: bookings, error: bookingsError } = await supabase
                        .from('bookings')
                        .select('id')
                        .eq('user_id', user.user_id);

                    if (bookingsError) throw bookingsError;

                    const bookingIds = bookings.map(b => b.id);

                    if (bookingIds.length > 0) {
                        // 2. Eliminar todo el inventario de todos los bookings
                        const { error: inventoryError } = await supabase
                            .from('inventory')
                            .delete()
                            .in('booking_id', bookingIds);

                        if (inventoryError) throw inventoryError;
                        console.log('✅ Inventario eliminado');

                        // 3. Eliminar todos los pagos
                        const { error: paymentsError } = await supabase
                            .from('payments')
                            .delete()
                            .in('booking_id', bookingIds);

                        if (paymentsError) throw paymentsError;
                        console.log('✅ Pagos eliminados');

                        // 4. Eliminar todos los bookings
                        const { error: bookingsDeleteError } = await supabase
                            .from('bookings')
                            .delete()
                            .eq('user_id', user.user_id);

                        if (bookingsDeleteError) throw bookingsDeleteError;
                        console.log('✅ Bookings eliminados');
                    }

                    // 5. Intentar eliminar de Auth (si existe)
                    try {
                        const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id);
                        if (authError) {
                            console.warn('⚠️ No se pudo eliminar de Auth (puede que no exista):', authError.message);
                        } else {
                            console.log('✅ Usuario eliminado de Auth');
                        }
                    } catch (authErr) {
                        console.warn('⚠️ Error eliminando de Auth:', authErr);
                    }

                    // 6. Eliminar usuario de la tabla users
                    const { error: userError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', user.user_id);

                    if (userError) throw userError;
                    console.log('✅ Usuario eliminado de la tabla users');

                    // Cerrar diálogo de confirmación
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));

                    // Mostrar alerta de éxito
                    setAlertDialog({
                        isOpen: true,
                        title: '✅ Usuario Eliminado',
                        message: `El usuario "${user.name}" ha sido eliminado completamente.\n\nTodos sus datos, bookings, inventario y pagos han sido eliminados de forma permanente.`,
                        type: 'success'
                    });

                    // Recargar datos
                    await loadStorage();
                    setSelectedUser(null);
                    setUserInventory([]);

                } catch (error) {
                    console.error('❌ Error eliminando usuario:', error);
                    
                    // Cerrar diálogo de confirmación
                    setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                    
                    // Mostrar alerta de error
                    setAlertDialog({
                        isOpen: true,
                        title: '❌ Error',
                        message: `Error al eliminar usuario:\n\n${error.message}`,
                        type: 'error'
                    });
                }
            }
        });
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
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestión de Bodegas</h1>
                    <p className="text-text-secondary mt-1">Metraje ocupado por usuario.</p>
                </div>
                <button
                    onClick={loadStorage}
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
                                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {sortedStorage.length > 0 ? (
                                sortedStorage.map((user, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr 
                                            onClick={() => handleSelectUser(user)}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedUser?.user_id === user.user_id ? 'bg-blue-50' : ''}`}
                                        >
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
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteUser(user);
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        delete
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Fila expandida con detalles de inventario */}
                                        {selectedUser?.user_id === user.user_id && (
                                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                                                <td colSpan="6" className="px-6 py-4">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h3 className="text-lg font-semibold text-text-primary">
                                                                Items de Inventario
                                                            </h3>
                                                            <div className="flex gap-2 items-center">
                                                                {user.bookings.length > 0 && (
                                                                    <button
                                                                        onClick={() => handleCancelService(user.bookings[0])}
                                                                        className="flex items-center gap-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-semibold transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">cancel</span>
                                                                        Cancelar Servicio
                                                                    </button>
                                                                )}
                                                                {inventoryLoading && <Spinner />}
                                                            </div>
                                                        </div>

                                                        {inventoryError && (
                                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                                                {inventoryError}
                                                            </div>
                                                        )}

                                                        {userInventory.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm">
                                                                    <thead>
                                                                        <tr className="bg-blue-100 border-b border-blue-300">
                                                                            <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                                                                Código
                                                                            </th>
                                                                            <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                                                                Nombre
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right font-semibold text-text-primary">
                                                                                Cantidad
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right font-semibold text-text-primary">
                                                                                Volumen (m³)
                                                                            </th>
                                                                            <th className="px-3 py-2 text-center font-semibold text-text-primary">
                                                                                Imagen
                                                                            </th>
                                                                            <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                                                                Estado
                                                                            </th>
                                                                            <th className="px-3 py-2 text-center font-semibold text-text-primary">
                                                                                Acciones
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-blue-200">
                                                                        {userInventory.map((item, itemIdx) => (
                                                                            <tr key={itemIdx} className="hover:bg-blue-100 transition-colors">
                                                                                <td className="px-3 py-2">
                                                                                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono text-xs font-bold">
                                                                                        {item.short_code || 'N/A'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-text-primary">
                                                                                    {item.name || item.item_name || 'Ítem sin nombre'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right text-text-primary font-semibold">
                                                                                    {item.quantity || 0}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right text-text-primary font-semibold">
                                                                                    {(Number(item.volume) || 0).toFixed(3)}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {item.image_url ? (
                                                                                        <a
                                                                                            href={item.image_url}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                                                                                            title="Ver imagen"
                                                                                        >
                                                                                            <span className="material-symbols-outlined text-sm">
                                                                                                image
                                                                                            </span>
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="text-gray-400 text-xs">Sin imagen</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                                        item.status === 'active' 
                                                                                            ? 'bg-green-100 text-green-700'
                                                                                            : 'bg-gray-100 text-gray-700'
                                                                                    }`}>
                                                                                        {item.status || 'activo'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <button
                                                                                        onClick={() => handleEditItem(item)}
                                                                                        className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                                                                        title="Editar item"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-sm">
                                                                                            edit
                                                                                        </span>
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : !inventoryLoading ? (
                                                            <div className="p-4 text-center text-text-secondary bg-gray-50 rounded">
                                                                No hay items de inventario para este usuario
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-text-secondary">
                                        No hay usuarios con bodegas ocupadas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Edición */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                title="Editar Item de Inventario"
            >
                <div className="space-y-4">
                    {/* Código del Item (solo lectura) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Código del Item
                        </label>
                        <input
                            type="text"
                            value={editingItem?.short_code || 'N/A'}
                            disabled
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Item *
                        </label>
                        <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => handleEditFormChange('name', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nombre del item"
                        />
                    </div>

                    {/* Cantidad y Volumen */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Cantidad *
                            </label>
                            <input
                                type="number"
                                value={editFormData.quantity}
                                onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                                min="0"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Volumen (m³) *
                            </label>
                            <input
                                type="number"
                                value={editFormData.volume}
                                onChange={(e) => handleEditFormChange('volume', e.target.value)}
                                step="0.001"
                                min="0"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            📸 Imagen del Item
                        </label>
                        
                        {/* Preview de imagen actual o nueva */}
                        {imagePreview && (
                            <div className="mb-3">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border-2 border-slate-300"
                                />
                            </div>
                        )}

                        {/* Input para nueva imagen */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {newImageFile ? `Nueva imagen seleccionada: ${newImageFile.name}` : 'Selecciona una nueva imagen para reemplazar la actual'}
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isSaving || uploadingImage}
                            className="flex-1"
                        >
                            {uploadingImage ? '📤 Subiendo imagen...' : isSaving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                        </Button>
                        <Button
                            onClick={handleCloseEditModal}
                            disabled={isSaving || uploadingImage}
                            className="bg-gray-500 hover:bg-gray-600"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                icon={confirmDialog.icon}
                requiresTextConfirmation={confirmDialog.requiresTextConfirmation}
                confirmationText={confirmDialog.confirmationText}
                isLoading={confirmDialog.isLoading}
                confirmText={confirmDialog.requiresTextConfirmation ? 'Eliminar' : 'Confirmar'}
                cancelText="Cancelar"
            />

            {/* Diálogo de Alerta */}
            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
            />
        </div>
    );
};

export default AdminStorage;
