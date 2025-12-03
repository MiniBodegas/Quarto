import { useState } from 'react';
import { ArrowLeftIcon } from './icons';
import { ScreenHeader, Button, Input } from '../index';
import { supabase } from '../../supabase';

const QuoteRequestScreen = ({
  totalVolume,
  totalItems,
  logisticsMethod,
  transportPrice,
  selectedItems,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [touched, setTouched] = useState({ email: false, phone: false });

  const loadFromLocalStorage = () => {
    try {
      const inventory = JSON.parse(localStorage.getItem('quarto_inventory') || '[]');
      const logisticsMethodLS = localStorage.getItem('quarto_logistics_method') || null;
      const transport = JSON.parse(localStorage.getItem('quarto_transport') || 'null');
      return { inventory, logisticsMethodLS, transport };
    } catch (error) {
      console.error('Error leyendo datos desde localStorage:', error);
      return { inventory: [], logisticsMethodLS: null, transport: null };
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') validateEmail(email);
    if (field === 'phone') validatePhone(phone);
  };

  const validateEmail = (value) => {
    if (!value) {
      setEmailError('El correo es obligatorio.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Por favor, introduce un formato de correo válido.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (value) => {
    if (!value) {
      setPhoneError('El teléfono es obligatorio.');
      return false;
    }
    if (value.length !== 10) {
      setPhoneError('El teléfono debe tener 10 dígitos.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) validateEmail(value);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      if (touched.phone) validatePhone(value);
    }
  };

  const isUuid = (v) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v || '');

  const generateShortCode = (prefix = '') =>
    `${(prefix || '').slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isNameValid = name.trim() !== '';
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);

    setTouched({ email: true, phone: true });

    if (!isNameValid || !isEmailValid || !isPhoneValid) {
      if (!isNameValid) alert('Por favor, ingresa tu nombre completo.');
      return;
    }

    const { inventory, logisticsMethodLS, transport } = loadFromLocalStorage();
    const finalLogisticsMethod = logisticsMethodLS || logisticsMethod;
    const finalTotalItems = totalItems ?? inventory.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    const finalTotalVolume = totalVolume ?? inventory.reduce((sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1), 0);

    try {
      // 1. Guarda el transporte si el método es "Recogida" (sin user_id por ahora)
      let transportId = null;
      if (finalLogisticsMethod === 'Recogida' && transport) {
        const { data: transportData, error: transportError } = await supabase
          .from('transports')
          .insert([{
            city: transport.city,
            street_type: transport.street_type,
            street_name: transport.street_name,
            number1: transport.number1,
            number2: transport.number2,
            has_no_number: transport.has_no_number || false,
            complement: transport.complement,
            total_volume: transport.total_volume,
            transport_price: transport.transport_price,
            user_id: null, // Se actualizará después
          }])
          .select()
          .single();

        if (transportError) {
          alert('Error al guardar el transporte: ' + transportError.message);
          return;
        }
        transportId = transportData.id;
      }

      // 2. Guarda la cotización en quotes (sin selected_items)
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          name,
          email,
          phone,
          total_volume: finalTotalVolume,
          total_items: finalTotalItems,
          logistics_method: finalLogisticsMethod,
          transport_price: finalLogisticsMethod === 'Recogida'
            ? (transport?.transport_price ?? transportPrice)
            : 0,
          user_id: null,
          Trasnport_id: transportId,
        }])
        .select()
        .single();

      if (quoteError) {
        alert('Error al guardar la cotización: ' + quoteError.message);
        return;
      }

      // Track created custom_items to later update user_id
      const customIds = [];

      // 3. Guarda los items en inventory con quote_id (sin selected_items)
      const rows = [];
      for (let idx = 0; idx < inventory.length; idx++) {
        const item = inventory[idx];
        let customItemId = null;

        if (item.isCustom) {
          const { data: customData, error: customError } = await supabase
            .from('custom_items')
            .insert([{
              name: item.name,
              width: item.width ?? null,
              height: item.height ?? null,
              depth: item.depth ?? null,
              volume: item.volume ?? 0,
              user_id: null,
            }])
            .select()
            .single();

          if (!customError && customData?.id) {
            customItemId = customData.id;
            customIds.push(customItemId); // <-- add to list
          } else {
            console.error('Error al guardar custom item:', customError);
          }
        }

        rows.push({
          quote_id: quote.id,
          booking_id: null, // debe ser nullable en la DB
          item_id: isUuid(item.id) && !item.isCustom ? item.id : null, // evita 22P02
          custom_item_id: customItemId,
          name: item.name,
          quantity: Number(item.quantity ?? 1),
          volume: Number(item.volume ?? 0),
          is_custom: Boolean(item.isCustom),
          short_code: generateShortCode(quote.id),
        });
      }

      const { error: inventoryError } = await supabase.from('inventory').insert(rows);
      if (inventoryError) {
        console.error('Error al guardar inventory:', inventoryError);
      }

      // 4. Crea o busca el usuario
      let userId;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{ name, email, phone }])
          .select()
          .single();
        
        if (userError) {
          console.error('Error al crear usuario:', userError);
        } else {
          userId = newUser.id;
        }
      }

      // 5. Actualiza relaciones con user_id
      if (userId) {
        await supabase.from('quotes').update({ user_id: userId }).eq('id', quote.id);
        if (transportId) {
          await supabase.from('transports').update({ user_id: userId }).eq('id', transportId);
        }
        if (customIds.length > 0) {
          await supabase.from('custom_items').update({ user_id: userId }).in('id', customIds);
        }
      }

      // 6. Enviar correo
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        await fetch(`${API_URL}/send-quote/${quote.id}`);
      } catch (fetchError) {
        console.error('Error al enviar correo:', fetchError);
        alert('Cotización guardada, pero no se pudo enviar el correo.');
      }

      // Limpia localStorage
      localStorage.removeItem('quarto_inventory');
      localStorage.removeItem('quarto_inventory_photos');
      localStorage.removeItem('quarto_logistics_method');
      localStorage.removeItem('quarto_transport');
      localStorage.removeItem('quarto_user');
      localStorage.removeItem('quarto_booking_contact');

      alert('¡Cotización guardada exitosamente! Pronto recibirás tu correo.');

    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error. Intenta de nuevo más tarde.');
    }
  };

  const isFormValid = name.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && !emailError && !phoneError;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto max-w-lg p-4 sm:p-6 lg:p-8 flex-grow flex flex-col justify-center">
        <ScreenHeader
          title="Solicita tu cotización"
          subtitle="Déjanos tus datos y te enviaremos una cotización personalizada."
        />
        <form onSubmit={handleSubmit} className="space-y-8 w-full">
          <div className="space-y-6">
            <Input id="name" label="Nombre completo" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana María" required autoComplete="name" />
            <Input id="email" label="Correo electrónico" type="email" value={email} onChange={handleEmailChange} onBlur={() => handleBlur('email')} placeholder="Ej: ana.maria@correo.com" required autoComplete="email" error={touched.email ? emailError : ''} />
            <Input id="phone" label="Teléfono" type="tel" inputMode="numeric" value={phone} onChange={handlePhoneChange} onBlur={() => handleBlur('phone')} placeholder="Ej: 3001234567" required autoComplete="tel" maxLength={10} error={touched.phone ? phoneError : ''} />
          </div>
          <div className="pt-4 text-center space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
            <Button type="submit" disabled={!isFormValid}>Solicitar Cotización</Button>
            <Button type="button" variant="secondary" onClick={onBack} icon={<ArrowLeftIcon className="w-5 h-5" />}>Volver</Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default QuoteRequestScreen;
