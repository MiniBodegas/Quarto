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
    const finalTotalVolume =
      totalVolume ?? inventory.reduce((sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1), 0);

    try {
      // 1) Upsert usuario por email
      let userId = null;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
        await supabase.from('users').update({ name, phone }).eq('id', userId);
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{ name, email, phone }])
          .select()
          .single();
        if (userError) {
          alert('No pudimos crear el usuario: ' + userError.message);
          return;
        }
        userId = newUser.id;
      }

      // 2) Guarda transporte (si aplica)
      let transportId = null;
      if (finalLogisticsMethod === 'Recogida' && transport) {
        const { data: transportData, error: transportError } = await supabase
          .from('transports')
          .insert([
            {
              city: transport.city,
              street_type: transport.street_type,
              street_name: transport.street_name,
              number1: transport.number1,
              number2: transport.number2,
              has_no_number: transport.has_no_number || false,
              complement: transport.complement,
              total_volume: transport.total_volume,
              transport_price: transport.transport_price,
              user_id: userId,
            },
          ])
          .select()
          .single();

        if (transportError) {
          alert('Error al guardar el transporte: ' + transportError.message);
          return;
        }
        transportId = transportData.id;
      }

      // 3) Guarda la cotización
      const { data: quoteRow, error: quoteErr } = await supabase
        .from('quotes')
        .insert([
          {
            name,
            email,
            phone,
            total_volume: finalTotalVolume,
            total_items: finalTotalItems,
            logistics_method: finalLogisticsMethod,
            transport_price: transportPrice,
            user_id: userId,
            Trasnport_id: transportId,
          },
        ])
        .select()
        .single();

      if (quoteErr) {
        alert('Error al guardar la cotización: ' + quoteErr.message);
        return;
      }
      const quoteId = quoteRow.id;

      // 4) Inserta inventory ligado a la cotización
      if (selectedItems?.length) {
        const payload = selectedItems.map((item) => ({
          quote_id: quoteId,
          item_id: null, // deja null para evitar UUID inválido; ajusta si tienes item_id UUID real
          name: item.name,
          quantity: Number(item.quantity ?? 1),
          volume: Number(item.volume ?? 0),
          is_custom: !!item.isCustom,
        }));
        const { error: invErr } = await supabase.from('inventory').insert(payload);
        if (invErr) {
          alert('Error al guardar los items: ' + invErr.message);
          return;
        }
      }

      // 5) Enviar correo con botón de reserva
      try {
        await fetch(`/api/send-quote/${quoteId}`, { method: 'POST' });
      } catch (fetchError) {
        console.error('Error al enviar correo:', fetchError);
        alert('Cotización guardada, pero no se pudo enviar el correo.');
      }

      // 6) Limpia storage y confirma
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="Solicita tu cotización"
          subtitle="Déjanos tus datos y te enviaremos una cotización personalizada."
        />

        <div className="mt-4 bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-7 w-full">
            <div className="space-y-6">
              <Input
                id="name"
                label="Nombre completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ana María"
                required
                autoComplete="name"
              />
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                placeholder="Ej: ana.maria@correo.com"
                required
                autoComplete="email"
                error={touched.email ? emailError : ''}
              />
              <Input
                id="phone"
                label="Teléfono"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur('phone')}
                placeholder="Ej: 3001234567"
                required
                autoComplete="tel"
                maxLength={10}
                error={touched.phone ? phoneError : ''}
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                icon={<ArrowLeftIcon className="w-5 h-5" />}
                className="sm:w-40 !py-2.5"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="flex-1 sm:flex-none sm:w-48 !py-2.5 font-bold shadow-lg hover:shadow-xl"
              >
                Solicitar Cotización
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default QuoteRequestScreen;
