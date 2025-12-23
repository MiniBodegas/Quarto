import { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../supabase';
import { useItemsByCategory, useInventory } from '../../hooks';
import {
  AddItemForm,
  Summary,
  ConfirmModal,
  ItemCard,
  ResultsScreen,
  TransportScreen,
  FinalSummaryScreen,
  QuoteRequestScreen,
  BookingScreen,
  ConfirmationScreen,
  ScreenHeader,
  Input,
  HomeScreen,
} from '../../Components';
import AIResultsScreen from '../../Components/calculator/AIResultsScreen';
import { SearchIcon, ChevronDownIcon } from '../../Components/calculator/icons';
import { InventoryPhotoScreen, PaymentScreen, AIPhotoScreen } from '../index';
import { calculateStoragePrice } from '../../utils/pricing'; // ✅ NUEVO (para totalPriceCOP)

// --- State Management with Reducer ---

const initialState = {
  view: 'home', // ✅ Nueva vista inicial
  mode: null, // 'manual' | 'ai'
  logisticsMethod: null,
  transportPrice: null,
  customerName: null,
  transactionId: null, // ✅ Guardar transaction ID de Wompi
  wompi: null,
  aiResults: null, // ✅ Almacenar resultados de IA
  isAddingToExisting: false, // ✅ Flag para saber si viene desde Inventory
  existingBookingId: null, // ✅ ID del booking al que agregar items
  invoiceInfo: null, // ✅ Info de factura generada (legacy)
  paymentInfo: null, // ✅ Info de pago generado (legacy - reservas nuevas)
  updateInfo: null, // ✅ Info de actualización (agregar items)
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SELECT_MODE':
      return {
        ...state,
        mode: action.payload,
        view: action.payload === 'manual' ? 'calculator' : 'aiPhotos',
      };

    case 'SET_ADDING_MODE':
      return {
        ...state,
        isAddingToExisting: true,
        existingBookingId: action.payload.bookingId,
        mode: 'manual',
        view: 'calculator',
      };

    case 'SET_WOMPI_ORDER':
      return { ...state, wompi: action.payload };

    case 'NAVIGATE_TO':
      return { ...state, view: action.payload };

    case 'SET_AI_RESULTS':
      return { ...state, aiResults: action.payload, view: 'aiResults' };

    case 'SELECT_LOGISTICS':
      return {
        ...state,
        logisticsMethod: action.payload,
        view: action.payload === 'Recogida' ? 'transport' : 'finalSummary',
      };

    case 'SET_TRANSPORT_PRICE':
      return { ...state, view: 'finalSummary', transportPrice: action.payload };

    case 'CONFIRM_BOOKING':
      return { 
        ...state, 
        view: 'confirmation', 
        customerName: action.payload.name,
        transactionId: action.payload.transactionId || null, // ✅ Guardar transaction ID
      };

    case 'SAVE_ITEMS_TO_EXISTING':
      return {
        ...state,
        view: 'confirmation',
        customerName: action.payload.name || 'Usuario',
        invoiceInfo: action.payload.invoiceInfo || null, // ✅ Info de factura generada (legacy)
        paymentInfo: action.payload.paymentInfo || null, // ✅ Info de pago generado (legacy - reservas nuevas)
        updateInfo: action.payload.updateInfo || null, // ✅ Info de actualización (agregar items)
      };

    case 'RESET_APP':
      return { ...initialState };

    case 'GO_BACK': {
      switch (state.view) {
        case 'calculator':
          // ✅ Volver a home = limpiar booking ID
          localStorage.removeItem('quarto_current_booking_id');
          return { ...initialState, view: 'home' };
        case 'aiPhotos':
          // ✅ Volver a home = limpiar booking ID
          localStorage.removeItem('quarto_current_booking_id');
          return { ...initialState, view: 'home' };
        case 'aiResults':
          return { ...state, view: 'aiPhotos' };
        case 'inventoryPhotos':
          // ✅ Volver a home = limpiar booking ID
          localStorage.removeItem('quarto_current_booking_id');
          return { ...initialState, view: 'home' };
        case 'logistics':
          return { ...state, view: state.mode === 'ai' ? 'aiResults' : 'calculator' };
        case 'transport':
          return { ...state, view: 'logistics', transportPrice: null };
        case 'finalSummary':
          return {
            ...state,
            view: state.logisticsMethod === 'Recogida' ? 'transport' : 'logistics',
          };
        case 'quoteRequest':
          return { ...state, view: 'finalSummary' };
        case 'booking':
          // ✅ NO limpiar booking ID aquí - permitir volver y seguir con el mismo booking
          return { ...state, view: 'finalSummary' };
        case 'payment':
          // ✅ NO limpiar booking ID aquí - permitir volver y seguir con el mismo booking
          return { ...state, view: 'booking' };
        case 'confirmation':
          // ✅ Después de confirmar = limpiar todo
          localStorage.removeItem('quarto_current_booking_id');
          return { ...initialState };
        default:
          return state;
      }
    }

    default:
      return state;
  }
}

// --- Main App Component ---
const Calculator = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { items, updateItemQuantity, addItem, removeItem, clearAll, resetToDefaults } = useInventory();

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStyled, setIsStyled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { categories, itemsByCategory, loading } = useItemsByCategory();

  // Verificar si viene desde Inventory para agregar items
  useEffect(() => {
    const checkAddingItems = async () => {
      const isAddingItems = localStorage.getItem('quarto_adding_items');
      
      if (isAddingItems === 'true') {
        console.log('[Calculator] 🔍 Usuario viene desde Inventory para agregar items');
        localStorage.removeItem('quarto_adding_items');
        
        try {
          // Verificar sesión
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            console.log('[Calculator] ⚠️ No hay sesión, mostrando home normal');
            return;
          }

          const userEmail = session.user.email;
          console.log('[Calculator] 📧 Email del usuario:', userEmail);
          
          // Verificar si tiene cuenta en users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (userError) {
            console.error('[Calculator] ❌ Error verificando usuario:', userError);
            return;
          }

          if (!userData) {
            console.log('[Calculator] 👤 Usuario sin cuenta registrada, flujo normal de contratación');
            alert('Primero debes completar el proceso de contratación para crear una cuenta.');
            return;
          }

          console.log('[Calculator] ✅ Usuario tiene cuenta registrada (ID:', userData.id, ')');
          
          // Verificar si tiene bookings activos (buscar por user_id O por email)
          const { data: bookingsByUserId, error: bookingsError1 } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', userData.id)
            .limit(1);

          const { data: bookingsByEmail, error: bookingsError2 } = await supabase
            .from('bookings')
            .select('id')
            .eq('email', userEmail)
            .limit(1);

          if (bookingsError1 || bookingsError2) {
            console.error('[Calculator] ❌ Error verificando bookings:', bookingsError1 || bookingsError2);
            return;
          }

          const hasBookings = (bookingsByUserId && bookingsByUserId.length > 0) || 
                              (bookingsByEmail && bookingsByEmail.length > 0);
          const firstBooking = bookingsByUserId?.[0] || bookingsByEmail?.[0];

          if (!hasBookings) {
            console.log('[Calculator] 📦 Usuario sin bookings activos, puede crear nueva reserva');
            alert('Tienes una cuenta registrada pero no tienes reservas activas. Completa el proceso para crear una nueva reserva.');
          } else {
            console.log('[Calculator] 🎉 Usuario con bookings activos, puede continuar agregando items');
            console.log('[Calculator] 🎯 Booking ID a usar:', firstBooking.id);
            // Ir directo a la calculadora manual con el booking existente
            dispatch({ 
              type: 'SET_ADDING_MODE', 
              payload: { bookingId: firstBooking.id } 
            });
          }
        } catch (error) {
          console.error('[Calculator] ❌ Error en verificación:', error);
        }
      }
    };

    checkAddingItems();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsStyled(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleAddItem = useCallback(
    (newItemData) => {
      const fullNewItem = addItem({ ...newItemData, isCustom: true });
      // ✅ Ya no guardamos manualmente - useInventory lo hace automáticamente
      setExpandedCategories((prev) => new Set(prev).add(fullNewItem.categoryId));
      setIsAddFormExpanded(false);
    },
    [addItem]
  );

  const handleClearAll = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmClear = () => {
    console.log('[Calculator] 🔄 Resetear a items por defecto (modo manual)');
    resetToDefaults(); // ✅ Volver a items iniciales en modo manual
    setSearchQuery('');
    setExpandedCategories(new Set());
    dispatch({ type: 'RESET_APP' });
    setShowConfirmModal(false);
  };

  const handleCancelClear = () => {
    setShowConfirmModal(false);
  };

  // Calcular items seleccionados (necesario antes de handleSaveItemsToExisting)
  const selectedItems = useMemo(() => items.filter((item) => item.quantity > 0), [items]);

  // Función para guardar items directamente al booking existente
  const handleSaveItemsToExisting = useCallback(async () => {
    try {
      console.log('[Calculator] 💾 Guardando items al booking existente:', state.existingBookingId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Error: No hay sesión activa');
        return;
      }

      // Obtener el nombre del usuario y el booking actual
      const { data: userData } = await supabase
        .from('users')
        .select('name, email, id')
        .eq('email', session.user.email)
        .single();

      // Obtener el booking actual para calcular nuevos totales
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', state.existingBookingId)
        .single();

      if (!currentBooking) {
        alert('Error: No se encontró el booking');
        return;
      }

      console.log('[Calculator] 📋 Booking actual:', currentBooking);

      // Calcular nuevos totales
      const newVolume = selectedItems.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
      const newItemsCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // ✅ Convertir explícitamente a número para evitar concatenación de strings
      const previousVolume = Number(currentBooking.total_volume) || 0;
      const updatedTotalVolume = previousVolume + newVolume;
      const updatedTotalItems = (Number(currentBooking.total_items) || 0) + newItemsCount;

      // Calcular nuevo precio mensual basado en el volumen total actualizado
      const newMonthlyPrice = calculateStoragePrice(updatedTotalVolume);

      console.log('[Calculator] 📊 Nuevos totales:', {
        volumeAnteriorRAW: currentBooking.total_volume,
        volumeAnteriorTIPO: typeof currentBooking.total_volume,
        volumeAnteriorNUMBER: previousVolume,
        volumeNuevo: newVolume,
        volumeTotal: updatedTotalVolume,
        precioParaEsteVolumen: `Para ${updatedTotalVolume.toFixed(2)}m³ debería ser $${newMonthlyPrice.toLocaleString('es-CO')}`,
        itemsAnteriores: currentBooking.total_items,
        itemsNuevos: newItemsCount,
        itemsTotal: updatedTotalItems,
      });

      // Función para generar código corto
      const generateShortCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      // Preparar items para insertar (estructura correcta de inventory)
      const itemsToInsert = selectedItems.map(item => ({
        booking_id: state.existingBookingId,
        item_id: !item.isCustom && item.id && typeof item.id === "string" && item.id.match(/^[0-9a-f-]{36}$/i) ? item.id : null,
        custom_item_id: null,
        name: item.name,
        quantity: Number(item.quantity ?? 1),
        volume: Number(item.volume ?? 0),
        is_custom: item.isCustom ?? false,
        short_code: generateShortCode(),
      }));

      console.log('[Calculator] 📦 Items a insertar:', itemsToInsert.length);
      console.log('[Calculator] 📦 Detalle de items:', itemsToInsert.map(i => ({
        name: i.name,
        quantity: i.quantity,
        volume: i.volume,
        is_custom: i.is_custom
      })));

      // 1. Insertar items en inventory
      const { error: insertError } = await supabase
        .from('inventory')
        .insert(itemsToInsert);

      if (insertError) {
        console.error('[Calculator] ❌ Error insertando items:', insertError);
        throw insertError;
      }

      console.log('[Calculator] ✅ Items guardados en inventory');

      // 2. Actualizar el booking con nuevos totales
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          total_volume: updatedTotalVolume,
          total_items: updatedTotalItems,
          amount_monthly: newMonthlyPrice,
        })
        .eq('id', state.existingBookingId);

      if (updateError) {
        console.error('[Calculator] ❌ Error actualizando booking:', updateError);
        throw updateError;
      }

      console.log('[Calculator] ✅ Booking actualizado con nuevos totales');

      // ✅ NO crear nuevo pago - solo actualizar el monto mensual del booking
      // La nueva cuota se cobrará automáticamente el siguiente mes
      console.log('[Calculator] ℹ️ Monto mensual actualizado. No se requiere pago adicional inmediato.');
      console.log('[Calculator] ℹ️ El nuevo monto ($' + newMonthlyPrice.toLocaleString('es-CO') + ') se cobrará en la próxima mensualidad.');

      // Ir a confirmación con info actualizada
      dispatch({ 
        type: 'SAVE_ITEMS_TO_EXISTING', 
        payload: { 
          name: userData?.name || 'Usuario',
          updateInfo: {
            itemsAdded: newItemsCount,
            volumeAdded: newVolume,
            previousVolume: previousVolume,
            newTotalVolume: updatedTotalVolume,
            previousMonthlyPrice: Number(currentBooking.amount_monthly) || 0,
            newMonthlyPrice: newMonthlyPrice,
          },
        } 
      });
    } catch (error) {
      console.error('[Calculator] ❌ Error guardando items:', error);
      alert('Error al guardar los items. Por favor intenta de nuevo.');
    }
  }, [state.existingBookingId, selectedItems]);

  const handleRemoveSelectedItem = useCallback(
    (id) => {
      const item = items.find((i) => i.id === id);
      if (item?.isCustom) removeItem(id);
      else updateItemQuantity(id, 0);
    },
    [items, removeItem, updateItemQuantity]
  );

  const handleToggleCategory = useCallback(
    (categoryId) => {
      if (searchQuery) return;
      setExpandedCategories((prev) => {
        const newSet = new Set(prev);
        newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
        return newSet;
      });
    },
    [searchQuery]
  );

  const { totalVolume, totalItems } = useMemo(() => {
    const result = items.reduce(
      (acc, item) => {
        const itemVolume = item.volume * item.quantity;
        console.log(`[CALCULATOR-VOLUME] Item: ${item.name}, volume: ${item.volume}m³, quantity: ${item.quantity}, total: ${itemVolume}m³`);
        acc.totalVolume += itemVolume;
        acc.totalItems += item.quantity;
        return acc;
      },
      { totalVolume: 0, totalItems: 0 }
    );
    console.log(`[CALCULATOR-VOLUME] 📊 TOTAL VOLUME: ${result.totalVolume.toFixed(3)}m³, TOTAL ITEMS: ${result.totalItems}`);
    return result;
  }, [items]);

  // ✅ Precio mensual basado en volumen (mismo cálculo que FinalSummary)
  const totalPriceCOP = useMemo(() => {
    try {
      const price = calculateStoragePrice(totalVolume);
      console.log(`[CALCULATOR-PRICE] 💰 Volume: ${totalVolume.toFixed(3)}m³ → Price: $${price.toLocaleString('es-CO')} COP`);
      if (price === null || isNaN(price)) {
        console.warn('[CALCULATOR] totalPriceCOP inválido:', price, 'totalVolume:', totalVolume);
        return 0;
      }
      return price;
    } catch (e) {
      console.error('[CALCULATOR] Error calculando totalPriceCOP:', e);
      return 0;
    }
  }, [totalVolume]);

  const opacityClass = `transition-opacity duration-500 ${isStyled ? 'opacity-100' : 'opacity-0'}`;

  const renderScreen = () => {
    switch (state.view) {
      case 'home':
        return (
          <HomeScreen
            onModeSelect={(mode) => {
              console.log('[Calculator] 🏠 Modo seleccionado:', mode);
              // ✅ Limpiar inventario y booking al seleccionar cualquier modo
              clearAll();
              localStorage.removeItem('quarto_current_booking_id');
              console.log('[Calculator] 🧹 Limpiado booking ID al cambiar de modo');
              // Pequeño delay para asegurar que se limpie antes de cambiar de vista
              setTimeout(() => {
                dispatch({ type: 'SELECT_MODE', payload: mode });
              }, 50);
            }}
          />
        );

      case 'aiPhotos':
        return (
          <AIPhotoScreen
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onContinue={(aiResults) => {
              console.log('[Calculator] Resultados de IA recibidos:', aiResults);
              dispatch({ type: 'SET_AI_RESULTS', payload: aiResults });
            }}
          />
        );

      case 'aiResults':
        return (
          <AIResultsScreen
            analysisResult={state.aiResults}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onContinue={(formattedItems) => {
              console.log('[Calculator] 📦 Items recibidos desde AIResults:', formattedItems);
              console.log('[Calculator] 🧹 Cantidad de items recibidos:', formattedItems.length);
              
              // ✅ IMPORTANTE: Limpiar inventario antes de agregar items de IA
              console.log('[Calculator] 🗑️ Limpiando inventario actual...');
              clearAll();
              
              // ✅ Usar setTimeout para asegurar que clearAll() termine antes de agregar
              setTimeout(() => {
                console.log('[Calculator] ➕ Agregando items al inventario...');
                formattedItems.forEach((item, index) => {
                  console.log(`[Calculator] Agregando item ${index + 1}:`, item.name, item.quantity, 'x', item.volume.toFixed(2), 'm³');
                  addItem(item);
                });
                
                console.log('[Calculator] ✅ Items agregados, navegando a logistics');
                // ✅ Ya no guardamos manualmente - el useEffect en useInventory lo hace automáticamente
                
                // Navegar a logistics después de agregar items
                dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
              }, 100); // Pequeño delay para que clearAll() se complete
            }}
            onAddMorePhotos={() => {
              dispatch({ type: 'NAVIGATE_TO', payload: 'aiPhotos' });
            }}
          />
        );

      case 'inventoryPhotos':
        return (
          <InventoryPhotoScreen
            selectedItems={selectedItems}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onContinue={(photos) => {
              localStorage.setItem('quarto_inventory_photos', JSON.stringify(photos));
              dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
            }}
          />
        );

      case 'logistics':
        return (
          <ResultsScreen
            totalVolume={totalVolume}
            totalItems={totalItems}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onContinue={(method) => dispatch({ type: 'SELECT_LOGISTICS', payload: method })}
          />
        );

      case 'transport':
        return (
          <TransportScreen
            totalVolume={totalVolume}
            onContinue={(price) => dispatch({ type: 'SET_TRANSPORT_PRICE', payload: price })}
            onBack={() => dispatch({ type: 'GO_BACK' })}
          />
        );

      case 'finalSummary':
        return (
          <FinalSummaryScreen
            totalVolume={totalVolume}
            totalItems={totalItems}
            logisticsMethod={state.logisticsMethod}
            transportPrice={state.transportPrice}
            isAddingToExisting={state.isAddingToExisting}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onGoToQuote={() => dispatch({ type: 'NAVIGATE_TO', payload: 'quoteRequest' })}
            onBookService={() => {
              // Si está agregando items a booking existente, guardar directo
              if (state.isAddingToExisting) {
                handleSaveItemsToExisting();
              } else {
                // Flujo normal: ir a booking
                dispatch({ type: 'NAVIGATE_TO', payload: 'booking' });
              }
            }}
          />
        );

      case 'quoteRequest':
        return (
          <QuoteRequestScreen
            totalVolume={totalVolume}
            totalItems={totalItems}
            logisticsMethod={state.logisticsMethod}
            transportPrice={state.transportPrice}
            selectedItems={selectedItems}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onSuccess={(name) => dispatch({ type: 'CONFIRM_BOOKING', payload: { name } })}
          />
        );

      case 'booking':
        return (
          <BookingScreen
            totalVolume={totalVolume}
            totalItems={totalItems}
            logisticsMethod={state.logisticsMethod}
            transportPrice={state.transportPrice}
            totalPriceCOP={totalPriceCOP} // ✅ NUEVO
            onBack={() => dispatch({ type: 'GO_BACK' })}

            // ✅ NUEVO: de Booking -> Payment con orden WOMPI
            onGoToPayment={(wompiOrder, meta) => {
              console.log('[CALCULATOR] onGoToPayment:', { wompiOrder, meta });
              dispatch({ type: 'SET_WOMPI_ORDER', payload: wompiOrder });
              dispatch({ type: 'NAVIGATE_TO', payload: 'payment' });
            }}

            // (fallback si aún lo usas en algún lado)
            onConfirm={(name) => dispatch({ type: 'CONFIRM_BOOKING', payload: { name } })}
          />
        );

      case 'payment':
        return (
          <PaymentScreen
            wompi={state.wompi}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onPaymentSuccess={(booking) => {
              console.log('[Calculator] 💳 Pago verificado exitosamente:', booking);
              console.log('[Calculator] 🎫 Transaction ID:', booking.wompi_transaction_id);
              
              // ✅ Limpiar todo después de pago exitoso
              clearAll();
              localStorage.removeItem('quarto_current_booking_id');
              localStorage.removeItem('quarto_booking_form');
              localStorage.removeItem('quarto_logistics_method');
              localStorage.removeItem('quarto_transport');
              console.log('[Calculator] 🧹 Sesión limpiada después de pago');
              
              // Navegar a confirmación con transaction ID
              dispatch({ 
                type: 'CONFIRM_BOOKING', 
                payload: { 
                  name: booking.name,
                  transactionId: booking.wompi_transaction_id // ✅ Pasar transaction ID
                } 
              });
            }}
          />
        );

      case 'confirmation':
        return (
          <ConfirmationScreen
            customerName={state.customerName}
            transactionId={state.transactionId} // ✅ Pasar transaction ID
            isAddingToExisting={state.isAddingToExisting}
            invoiceInfo={state.invoiceInfo} // ✅ Info de factura generada (legacy)
            paymentInfo={state.paymentInfo} // ✅ Info de pago generado (legacy - para reservas nuevas)
            updateInfo={state.updateInfo} // ✅ Info de actualización (para agregar items)
            onReset={() => {
              console.log('[Calculator] 🔄 Reset completo después de confirmación');
              resetToDefaults(); // ✅ Volver a items iniciales
              localStorage.removeItem('quarto_current_booking_id');
              console.log('[Calculator] 🧹 Limpiado booking ID en reset');
              dispatch({ type: 'RESET_APP' });
            }}
          />
        );

      case 'calculator':
      default:
        return (
          <div className="w-full px-4 sm:px-6 lg:px-8 flex-grow relative pb-20">
            <ScreenHeader
              title="Calcula tu espacio"
              subtitle="Selecciona los artículos que tienes para almacenar."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <Input
                  id="search-items"
                  label="Buscar artículo por nombre"
                  hideLabel
                  placeholder="Buscar artículo por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<SearchIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                  className="py-3 pr-4"
                />

                {loading ? (
                  <div className="text-center py-8 text-slate-500">Cargando artículos...</div>
                ) : (
                  categories.map((category) => {
                    const categoryItems = searchQuery
                      ? itemsByCategory[category.id]?.filter((item) =>
                          item.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      : itemsByCategory[category.id];

                    if (!categoryItems || categoryItems.length === 0) return null;

                    const isExpanded = !!searchQuery || expandedCategories.has(category.id);

                    return (
                      <div
                        key={category.id}
                        className="bg-white rounded-2xl border border-border dark:border-border-dark mb-6 max-w-full overflow-hidden"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                      >
                        <button
                          onClick={() => handleToggleCategory(category.id)}
                          className={`w-full flex justify-between items-center p-4 sm:p-5 text-left ${!searchQuery ? 'cursor-default' : ''}`}
                          aria-expanded={isExpanded}
                        >
                          <h2 className="text-xl font-bold text-[#012E58]">{category.name}</h2>
                          <div className="bg-muted dark:bg-secondary-dark rounded-full p-1">
                            <ChevronDownIcon
                              className={`w-5 h-5 text-text-light text-[#012E58] transform transition-transform duration-300 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 sm:px-6 pb-6 border-t border-border dark:border-slate-700 text-[#012E58]">
                            <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                              {categoryItems.map((item) => {
                                // ✅ Buscar cantidad en el state de inventory
                                const inventoryItem = items.find((i) => i.id === item.id);
                                const currentQuantity = inventoryItem?.quantity ?? 0;
                                
                                return (
                                  <ItemCard
                                    key={item.id}
                                    item={{ ...item, quantity: currentQuantity }}
                                    onQuantityChange={(id, newQuantity) => {
                                      if (newQuantity > 0) {
                                        // Si la cantidad es > 0, agregar o actualizar
                                        const existingItem = items.find(i => i.id === id);
                                        if (existingItem) {
                                          updateItemQuantity(id, newQuantity);
                                        } else {
                                          // Agregar item de la DB al state
                                          addItem({ ...item, quantity: newQuantity });
                                        }
                                      } else {
                                        // Si la cantidad es 0, eliminar del state
                                        updateItemQuantity(id, 0);
                                        removeItem(id);
                                      }
                                    }}
                                    onRemove={removeItem}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="bg-white rounded-2xl border border-border dark:border-border-dark">
                  <button
                    onClick={() => setIsAddFormExpanded((p) => !p)}
                    className="w-full flex justify-between items-center p-4 sm:p-5 text-left"
                    aria-expanded={isAddFormExpanded}
                  >
                    <h2 className="text-xl font-bold text-[#012E58]">Añadir artículo personalizado</h2>
                    <div className="bg-muted dark:bg-secondary-dark rounded-full p-1">
                      <ChevronDownIcon
                        className={`w-5 h-5 text-text-light dark:text-slate-400 transform transition-transform duration-300 ${
                          isAddFormExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isAddFormExpanded && (
                    <div className="px-5 sm:px-6 pb-6 border-t border-border dark:border-slate-700">
                      <div className="pt-6">
                        <AddItemForm onAddItem={handleAddItem} categories={categories} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="lg:sticky top-8 self-start space-y-8 w-full">
                <Summary
                  totalVolume={totalVolume}
                  totalItems={totalItems}
                  selectedItems={selectedItems}
                  onContinue={() => {
                    // ✅ Ya no guardamos manualmente - useInventory sincroniza automáticamente
                    dispatch({ type: 'NAVIGATE_TO', payload: 'logistics' });
                  }}
                  onClearAll={handleClearAll}
                  onRemoveItem={handleRemoveSelectedItem}
                />
              </aside>
            </div>

            {/* Botón Volver al Home - Parte inferior izquierda */}
            <div className="fixed bottom-6 left-6 z-40">
              <button
                onClick={() => dispatch({ type: 'GO_BACK' })}
                className="group flex items-center gap-2 bg-white hover:bg-[#074BED] text-[#012E58] hover:text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#012E58] hover:border-[#074BED] font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="hidden sm:inline">Cambiar método</span>
                <span className="sm:hidden">Volver</span>
              </button>
            </div>
          </div>
        );
    }
  };

  useEffect(() => {
    const quoteId = new URLSearchParams(window.location.search).get('quoteId');
    if (!quoteId) return;

    (async () => {
      try {
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (quoteError || !quote) {
          console.error('Error cargando cotización:', quoteError);
          return;
        }

        const { data: inv, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .eq('quote_id', quoteId);

        if (invError) {
          console.error('Error cargando inventario:', invError);
          return;
        }

        const mapped = (inv || []).map((r) => ({
          id: r.item_id || r.custom_item_id || r.id,
          name: r.name,
          volume: parseFloat(r.volume) || 0,
          quantity: parseInt(r.quantity) || 0,
          isCustom: r.is_custom,
          width: parseFloat(r.width) || 0,
          height: parseFloat(r.height) || 0,
          depth: parseFloat(r.depth) || 0,
        }));

        clearAll();
        mapped.forEach((m) => {
          const added = addItem(m);
          if (m.quantity > 1) updateItemQuantity(added.id, m.quantity);
        });

        localStorage.setItem(
          'quarto_user',
          JSON.stringify({ name: quote.name, email: quote.email, phone: quote.phone })
        );

        localStorage.setItem('quarto_logistics_method', quote.logistics_method);

        if (quote.logistics_method === 'Recogida' && quote.Trasnport_id) {
          const { data: transport, error: transportError } = await supabase
            .from('transports')
            .select('*')
            .eq('id', quote.Trasnport_id)
            .single();

          if (transportError) console.error('Error cargando transporte:', transportError);
          else if (transport) localStorage.setItem('quarto_transport', JSON.stringify(transport));
        }

        dispatch({
          type: 'SELECT_LOGISTICS',
          payload: quote.logistics_method === 'Recogida' ? 'Recogida' : 'En bodega',
        });

        if (quote.transport_price != null) {
          dispatch({ type: 'SET_TRANSPORT_PRICE', payload: quote.transport_price });
        }

        window.history.replaceState({}, '', window.location.pathname);

        setTimeout(() => {
          dispatch({ type: 'NAVIGATE_TO', payload: 'booking' });
        }, 100);
      } catch (error) {
        console.error('Error en useEffect quoteId:', error);
      }
    })();
  }, [dispatch, addItem, updateItemQuantity, clearAll, resetToDefaults]);

  return (
    <div className={`Calculator ${opacityClass} flex flex-col min-h-screen overflow-y-auto`}>
      {renderScreen()}
      {showConfirmModal && (
        <ConfirmModal
          open={showConfirmModal}
          title="¿Estás seguro de que quieres limpiar todo?"
          message="Esto eliminará todos los artículos de tu inventario."
          onConfirm={handleConfirmClear}
          onCancel={handleCancelClear}
        />
      )}
    </div>
  );
};

export default Calculator;
