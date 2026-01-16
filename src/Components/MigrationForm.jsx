import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { calculateStoragePrice } from '../utils/pricing';

const MigrationForm = () => {
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    phone: '',
    document_type: 'CC',
    document_number: '',
  });

  const [bookingData, setBookingData] = useState({
    amount_monthly: '',
    amount_total: '',
    transport_price: '0',
  });

  const [items, setItems] = useState([{
    id: Date.now(),
    booking_id: '',
    item_id: '',
    item_name: '',
    quantity: 1,
    volume: 0,
    is_custom: false,
    short_code: '',
    custom_item_id: '',
    quote_id: '',
  }]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Calcular precio automáticamente cuando cambian los items
  useEffect(() => {
    const totalVolume = items.reduce((sum, item) => sum + parseFloat(item.volume || 0), 0);
    const calculatedPrice = calculateStoragePrice(totalVolume);
    
    console.log('🔄 Recalculando precio:', {
      totalVolume: totalVolume.toFixed(2),
      calculatedPrice,
      itemsCount: items.length
    });
    
    setBookingData(prev => ({
      ...prev,
      amount_monthly: calculatedPrice.toString(),
      amount_total: calculatedPrice.toString(), // Por defecto igual al mensual
    }));
  }, [items]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      booking_id: '',
      item_id: '',
      item_name: '',
      quantity: 1,
      volume: 0,
      is_custom: false,
      short_code: '',
      custom_item_id: '',
      quote_id: '',
    }]);
  };

  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Crear o actualizar usuario
      let userId = null;
      if (userData.email) {
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .maybeSingle();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          throw userCheckError;
        }

        if (existingUser) {
          // Actualizar usuario existente
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: userData.name || null,
              phone: userData.phone || null,
            })
            .eq('id', existingUser.id);

          if (updateError) throw updateError;
          userId = existingUser.id;
          console.log('✅ Usuario actualizado:', existingUser.id);
        } else {
          // Crear nuevo usuario
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              email: userData.email,
              name: userData.name || null,
              phone: userData.phone || null,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          userId = newUser.id;
          console.log('✅ Usuario creado:', newUser.id);
        }
      }

      // 2. Crear booking si hay items válidos
      const validItems = items.filter(item => item.item_name.trim());
      let bookingId = null;
      
      if (validItems.length > 0 && userId) {
        // Calcular totales
        const totalVolume = validItems.reduce((sum, item) => sum + parseFloat(item.volume || 0), 0);
        const totalItems = validItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
        
        // Preparar datos del booking
        const bookingPayload = {
          user_id: userId,
          booking_type: 'person',
          name: userData.name || 'Usuario Migrado',
          email: userData.email,
          phone: userData.phone,
          document_type: userData.document_type || 'CC',
          document_number: userData.document_number,
          date: new Date().toISOString().split('T')[0],
          time_slot: 'AM',
          total_volume: totalVolume.toFixed(2),
          total_items: totalItems,
          logistics_method: 'En bodega',
          transport_price: parseFloat(bookingData.transport_price || '0'),
          amount_monthly: parseFloat(bookingData.amount_monthly || '0'),
          amount_total: parseFloat(bookingData.amount_total || '0'),
          payment_status: 'PENDING',
        };
        
        console.log('📋 Payload del booking:', bookingPayload);
        console.log('💰 Precios a guardar:', {
          amount_monthly: bookingPayload.amount_monthly,
          amount_total: bookingPayload.amount_total,
          transport_price: bookingPayload.transport_price
        });
        
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingPayload)
          .select()
          .single();

        if (bookingError) throw bookingError;
        bookingId = newBooking.id;
        console.log('✅ Booking creado:', bookingId);
        console.log('✅ Datos guardados del booking:', {
          amount_monthly: newBooking.amount_monthly,
          amount_total: newBooking.amount_total,
          transport_price: newBooking.transport_price,
          total_volume: newBooking.total_volume
        });

        // 3. Insertar todos los items de inventario asociados al booking
        const inventoryDataArray = validItems.map(item => ({
          booking_id: bookingId,
          item_id: item.item_id || generateUUID(),
          name: item.item_name,
          quantity: parseInt(item.quantity) || 1,
          volume: parseFloat(item.volume) || 0,
          is_custom: item.is_custom,
          short_code: item.short_code || generateShortCode(),
          custom_item_id: item.custom_item_id || null,
          quote_id: item.quote_id || null,
        }));

        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .insert(inventoryDataArray)
          .select();

        if (inventoryError) throw inventoryError;
        console.log(`✅ ${inventory.length} items de inventario creados`);
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Datos guardados exitosamente: Usuario ${userId ? `(ID: ${userId})` : ''} + Booking ${bookingId ? `(ID: ${bookingId})` : ''} + ${validItems.length} item(s)`
      });

      // Limpiar formulario
      setUserData({
        email: '',
        name: '',
        phone: '',
        document_type: 'CC',
        document_number: '',
      });
      setBookingData({
        amount_monthly: '',
        amount_total: '',
        transport_price: '0',
      });
      setItems([{
        id: Date.now(),
        booking_id: '',
        item_id: '',
        item_name: '',
        quantity: 1,
        volume: 0,
        is_custom: false,
        short_code: '',
        custom_item_id: '',
        quote_id: '',
      }]);

    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      setMessage({ 
        type: 'error', 
        text: '❌ Error: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#012E58] mb-2">
          Formulario de Migración
        </h1>
        <p className="text-slate-600 mb-6">
          Formulario temporal para migración de datos
        </p>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección Usuario */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-xl font-bold text-[#012E58] mb-4">
              📧 Datos de Usuario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleUserChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleUserChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleUserChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  name="document_type"
                  value={userData.document_type}
                  onChange={handleUserChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">Pasaporte (PAS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  name="document_number"
                  value={userData.document_number}
                  onChange={handleUserChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="1234567890"
                />
              </div>
            </div>
          </div>

          {/* Sección Precios del Booking */}
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-xl font-bold text-[#012E58] mb-4">
              💰 Precios y Facturación
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Los precios se calculan automáticamente según el volumen total de items. Puedes editarlos manualmente si es necesario.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Mensual (COP) *
                </label>
                <input
                  type="number"
                  name="amount_monthly"
                  value={bookingData.amount_monthly}
                  onChange={handleBookingChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent text-black font-semibold"
                  placeholder="150000"
                />
                <p className="text-xs text-slate-500 mt-1">✅ Calculado automáticamente por volumen</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Total Inicial (COP)
                </label>
                <input
                  type="number"
                  name="amount_total"
                  value={bookingData.amount_total}
                  onChange={handleBookingChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="150000"
                />
                <p className="text-xs text-slate-500 mt-1">Igual al mensual por defecto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Transporte (COP)
                </label>
                <input
                  type="number"
                  name="transport_price"
                  value={bookingData.transport_price}
                  onChange={handleBookingChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">Costo de transporte si aplica</p>
              </div>
            </div>
          </div>

          {/* Sección Inventario */}
          <div className="pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#012E58]">
                📦 Items de Inventario ({items.length})
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Volumen Total</p>
                  <p className="text-lg font-bold text-[#074BED]">
                    {items.reduce((sum, item) => sum + parseFloat(item.volume || 0), 0).toFixed(2)} m³
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
                >
                  ➕ Agregar Item
                </button>
              </div>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="mb-6 p-4 border-2 border-slate-200 rounded-lg bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#012E58]">Item #{index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre del Item *
                    </label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(item.id, 'item_name', e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="Caja mediana"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Volumen (m³) *
                    </label>
                    <input
                      type="number"
                      value={item.volume}
                      onChange={(e) => handleItemChange(item.id, 'volume', e.target.value)}
                      required
                      step="0.001"
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Código Corto
                    </label>
                    <input
                      type="text"
                      value={item.short_code}
                      onChange={(e) => handleItemChange(item.id, 'short_code', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="ABC123 (auto-generado si vacío)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Booking ID (UUID)
                    </label>
                    <input
                      type="text"
                      value={item.booking_id}
                      onChange={(e) => handleItemChange(item.id, 'booking_id', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="Auto-generado si vacío"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Item ID (UUID)
                    </label>
                    <input
                      type="text"
                      value={item.item_id}
                      onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="Auto-generado si vacío"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quote ID (UUID)
                    </label>
                    <input
                      type="text"
                      value={item.quote_id}
                      onChange={(e) => handleItemChange(item.id, 'quote_id', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="Auto-generado si vacío"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Custom Item ID (UUID)
                    </label>
                    <input
                      type="text"
                      value={item.custom_item_id}
                      onChange={(e) => handleItemChange(item.id, 'custom_item_id', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#074BED] focus:border-transparent bg-white text-black"
                      placeholder="Auto-generado si vacío"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.is_custom}
                        onChange={(e) => handleItemChange(item.id, 'is_custom', e.target.checked)}
                        className="w-4 h-4 text-[#074BED] border-slate-300 rounded focus:ring-[#074BED]"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Item personalizado (is_custom)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#074BED] hover:bg-[#0639C8] shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Datos'}
            </button>

            <button
              type="button"
              onClick={() => {
                  if (confirm('¿Estás seguro de limpiar el formulario?')) {
                  setUserData({
                    email: '',
                    name: '',
                    phone: '',
                    document_type: 'CC',
                    document_number: '',
                  });
                  setBookingData({
                    amount_monthly: '',
                    amount_total: '',
                    transport_price: '0',
                  });
                  setItems([{
                    id: Date.now(),
                    booking_id: '',
                    item_id: '',
                    item_name: '',
                    quantity: 1,
                    volume: 0,
                    is_custom: false,
                    short_code: '',
                    custom_item_id: '',
                    quote_id: '',
                  }]);
                  setMessage({ type: '', text: '' });
                }
              }}
              className="py-3 px-6 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              🔄 Limpiar
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Nota:</strong> Este es un formulario temporal para migración de datos.
            Se creará automáticamente un <code>booking</code> tipo "person" con:
            <br />• payment_status: "PENDING" • time_slot: "AM" • logistics_method: "En bodega" 
            <br />• total_volume y total_items calculados automáticamente
            <br />• <strong>amount_monthly:</strong> Precio mensual recurrente que aparecerá en las facturas
            <br />• <strong>amount_total:</strong> Precio del primer pago (opcional, si es diferente al mensual)
            <br />Los campos <code>item_id</code> y <code>short_code</code> se auto-generan si están vacíos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MigrationForm;
