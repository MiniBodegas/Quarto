import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useItemsByCategory } from '../hooks';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ItemCard from './calculator/ItemCard';

const AddItemsToInventory = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { categories, itemsByCategory } = useItemsByCategory();

  // Convertir el objeto itemsByCategory a un array plano
  const allItems = Object.values(itemsByCategory).flat();

  // Verificar autenticación y cargar bookings
  useEffect(() => {
    const loadUserBookings = async () => {
      try {
        console.log('[AddItemsToInventory] Iniciando carga de bookings...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('[AddItemsToInventory] No hay sesión, redirigiendo a login');
          navigate('/login');
          return;
        }

        const authId = session.user.id;
        const userEmail = session.user.email;
        console.log('[AddItemsToInventory] Usuario autenticado - auth.uid():', authId);
        console.log('[AddItemsToInventory] Usuario autenticado - email:', userEmail);
        
        // Primero, obtener el user_id de la tabla users usando el email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (userError) {
          console.error('[AddItemsToInventory] Error obteniendo usuario:', userError);
          alert('Error al cargar tus datos. Por favor intenta de nuevo.');
          navigate('/user');
          return;
        }

        const actualUserId = userData?.id || authId;
        console.log('[AddItemsToInventory] ID de usuario a usar para bookings:', actualUserId);
        setUserId(actualUserId);

        // Cargar bookings del usuario usando el ID de la tabla users
        const { data: userBookings, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', actualUserId)
          .order('created_at', { ascending: false });

        console.log('[AddItemsToInventory] Bookings obtenidos:', userBookings?.length || 0);
        console.log('[AddItemsToInventory] Bookings data:', userBookings);

        if (error) {
          console.error('[AddItemsToInventory] Error cargando bookings:', error);
        }

        // Si hay bookings, seleccionar el primero por defecto
        if (userBookings && userBookings.length > 0) {
          console.log('[AddItemsToInventory] Bookings cargados exitosamente:', userBookings.length);
          setBookings(userBookings);
          setSelectedBookingId(userBookings[0].id);
          console.log('[AddItemsToInventory] Booking seleccionado:', userBookings[0].id);
        } else {
          console.log('[AddItemsToInventory] No se encontraron bookings activos');
          
          // Verificar si el usuario ya tiene una cuenta registrada en la tabla users
          if (userData) {
            console.log('[AddItemsToInventory] Usuario ya tiene cuenta registrada (ID:', userData.id, '), pero sin bookings activos');
            // El usuario tiene cuenta pero no tiene bookings activos
            // Permitir crear nueva reserva desde aquí o mostrar mensaje
            setBookings([]);
          } else {
            console.log('[AddItemsToInventory] Usuario sin cuenta registrada, redirigiendo a flujo de contratación');
            // Si no tiene cuenta en users, redirigir al flujo completo de contratación
            alert('Primero debes completar el proceso de contratación para crear una cuenta.');
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('[AddItemsToInventory] Error:', error);
      } finally {
        console.log('[AddItemsToInventory] Finalizando carga, isLoading = false');
        setIsLoading(false);
      }
    };

    loadUserBookings();
  }, [navigate]);

  // Filtrar items por categoría
  const filteredItems = allItems.filter((item) => {
    return filterCategory === 'all' || item.categoryId === filterCategory;
  });

  // Manejar selección de item
  const handleAddItem = (item) => {
    const existingIndex = selectedItems.findIndex(i => i.name === item.name);
    
    if (existingIndex >= 0) {
      // Incrementar cantidad
      const updated = [...selectedItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      setSelectedItems(updated);
    } else {
      // Agregar nuevo
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  // Manejar cambio de cantidad
  const handleQuantityChange = (itemName, newQuantity) => {
    if (newQuantity <= 0) {
      // Remover item
      setSelectedItems(selectedItems.filter(i => i.name !== itemName));
    } else {
      // Verificar si el item ya existe
      const existingIndex = selectedItems.findIndex(i => i.name === itemName);
      
      if (existingIndex >= 0) {
        // Actualizar cantidad del item existente
        const updated = [...selectedItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity };
        setSelectedItems(updated);
      } else {
        // Agregar nuevo item (buscar en allItems para obtener datos completos)
        const fullItem = allItems.find(i => (i.id || i.name) === itemName || i.name === itemName);
        if (fullItem) {
          setSelectedItems([...selectedItems, { ...fullItem, quantity: newQuantity }]);
        }
      }
    }
  };

  // Guardar items en inventario
  const handleSaveItems = async () => {
    console.log('[AddItemsToInventory] handleSaveItems - Iniciando guardado');
    console.log('[AddItemsToInventory] selectedItems:', selectedItems.length);
    console.log('[AddItemsToInventory] bookings.length:', bookings.length);
    console.log('[AddItemsToInventory] selectedBookingId:', selectedBookingId);
    
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un item');
      return;
    }

    // Si no hay bookings, mostrar mensaje y redirigir al portal
    if (bookings.length === 0 || !selectedBookingId) {
      console.log('[AddItemsToInventory] ❌ No hay booking disponible');
      alert('Necesitas tener una reserva activa para agregar items. Por favor completa una reserva desde tu portal primero.');
      navigate('/user');
      return;
    }

    console.log('[AddItemsToInventory] ✅ Validaciones pasadas, procediendo a guardar');
    setIsSaving(true);
    
    try {
      // Preparar items para insertar
      const itemsToInsert = selectedItems.map(item => {
        // Buscar el nombre de la categoría
        const category = categories.find(cat => cat.id === item.categoryId);
        const categoryName = category ? category.name : 'Sin Categoría';
        
        return {
          booking_id: selectedBookingId,
          storage_unit_id: selectedBookingId, // Usar booking_id como storage_unit_id
          name: item.name,
          category: categoryName,
          quantity: item.quantity,
          volume: item.volume,
          description: item.description || '',
          short_code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Código aleatorio
          created_at: new Date().toISOString(),
        };
      });

      console.log('[AddItemsToInventory] Insertando items:', itemsToInsert);

      const { data, error } = await supabase
        .from('inventory')
        .insert(itemsToInsert)
        .select();

      if (error) {
        console.error('[AddItemsToInventory] Error insertando:', error);
        throw error;
      }

      console.log('[AddItemsToInventory] ✅ Items agregados:', data.length);
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[AddItemsToInventory] Error:', error);
      alert('Error al agregar los items. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular totales
  const totalVolume = selectedItems.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Volver al Portal
          </button>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Agregar Items a tu Inventario
          </h1>
          <p className="text-gray-600">
            Selecciona los objetos que quieres agregar a tu bodega
          </p>
          
          {/* Mensaje si no hay bookings */}
          {bookings.length === 0 && (
            <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-600 text-3xl">info</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    No tienes reservas activas
                  </h3>
                  <p className="text-blue-800 text-sm mb-4">
                    Tu cuenta está registrada, pero necesitas crear una reserva antes de poder agregar items a tu inventario.
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="material-symbols-outlined text-sm mr-2">add_circle</span>
                    Crear Nueva Reserva
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal - solo mostrar si hay bookings */}
        {bookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de items */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              {/* Seleccionar bodega si hay múltiples */}
              {bookings.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bodega destino:
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {bookings.map((booking, index) => (
                      <option key={booking.id} value={booking.id}>
                        Bodega {index + 1} - {booking.storage_location || 'Principal'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro de categorías */}
              <div className="mb-6">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Grid de items con scroll */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const selectedItem = selectedItems.find(i => i.name === item.name);
                  const itemWithQuantity = {
                    ...item,
                    id: item.id || item.name, // Usar name como fallback si no hay id
                    quantity: selectedItem?.quantity || 0
                  };
                  
                  return (
                    <ItemCard
                      key={item.name}
                    item={itemWithQuantity}
                    onQuantityChange={(itemId, newQty) => handleQuantityChange(item.name, newQty)}
                    onRemove={item.isCustom ? () => {} : undefined}
                  />
                );
              })}
              </div>
            </div>

            {filteredItems.length === 0 && (
              <Card className="text-center py-12">
                <p className="text-gray-500">No se encontraron items</p>
              </Card>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Resumen
              </h2>

              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No has seleccionado ningún item
                </p>
              ) : (
                <>
                  {/* Items seleccionados */}
                  <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {item.volume}m³ = {(item.quantity * item.volume).toFixed(2)}m³
                          </p>
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item.name, 0)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Total items:</span>
                      <span className="font-bold text-gray-800">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volumen total:</span>
                      <span className="font-bold text-gray-800">{totalVolume.toFixed(2)} m³</span>
                    </div>
                  </div>

                  {/* Botón guardar */}
                  <Button
                    onClick={handleSaveItems}
                    disabled={isSaving || bookings.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin material-symbols-outlined mr-2 text-lg">refresh</span>
                        Guardando...
                      </>
                    ) : bookings.length === 0 ? (
                      <>
                        <span className="material-symbols-outlined mr-2 text-lg">lock</span>
                        Necesitas una reserva activa
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2 text-lg">save</span>
                        Agregar a mi Inventario
                      </>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
        ) : null}
      </div>

      {/* Modal de éxito */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Items agregados!
          </h3>
          <p className="text-gray-600 mb-6">
            Se agregaron {totalItems} items ({totalVolume.toFixed(2)} m³) a tu inventario
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedItems([]);
              }}
              variant="outline"
            >
              Agregar más items
            </Button>
            <Button
              onClick={() => navigate('/user')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Volver al Portal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddItemsToInventory;
