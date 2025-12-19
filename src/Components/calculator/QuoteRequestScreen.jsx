import { useState } from 'react';
import { ArrowLeftIcon } from './icons';
import { ScreenHeader, Button, Input } from '../index';
import { supabase } from '../../supabase';

const generateShortCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const QuoteRequestScreen = ({
  totalVolume,
  totalItems,
  logisticsMethod,
  transportPrice,
  selectedItems,
  onBack,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [touched, setTouched] = useState({ email: false, phone: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    setIsLoading(true);

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
          setIsLoading(false);
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
          setIsLoading(false);
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
        setIsLoading(false);
        alert('Error al guardar la cotización: ' + quoteErr.message);
        return;
      }
      const quoteId = quoteRow.id;

      // 4) Inserta inventory ligado a la cotización
      if (selectedItems?.length) {
        for (const item of selectedItems) {
          let customItemId = null;

          // Si es custom, primero guardar en custom_items
          if (item.isCustom) {
            const { data: customData, error: customError } = await supabase
              .from('custom_items')
              .insert([{
                name: item.name,
                width: item.width || 0,
                height: item.height || 0,
                depth: item.depth || 0,
                volume: item.volume || 0,
                user_id: userId,
              }])
              .select()
              .single();

            if (customError) {
              console.warn('[Quote] Error guardando custom_item:', customError);
              setIsLoading(false);
              alert('Error al guardar item personalizado: ' + customError.message);
              return;
            }

            customItemId = customData.id;
          }

          // Guardar en inventory
          const inventoryPayload = {
            quote_id: quoteId,
            item_id: !item.isCustom && item.id ? item.id : null,
            custom_item_id: customItemId,
            name: item.name,
            quantity: Number(item.quantity ?? 1),
            volume: Number(item.volume ?? 0),
            is_custom: !!item.isCustom,
            short_code: generateShortCode(),
          };

          const { error: invErr } = await supabase.from('inventory').insert([inventoryPayload]);
          if (invErr) {
            setIsLoading(false);
            alert('Error al guardar el inventario: ' + invErr.message);
            return;
          }
        }
      }

      // 5) Mostrar modal de éxito
      setShowSuccessModal(true);

      // 6) Enviar correo con botón de reserva (en segundo plano)
      fetch(`/api/send-quote/${quoteId}`, { method: 'POST' })
        .catch((fetchError) => {
          console.error('Error al enviar correo:', fetchError);
        });

      // 7) Limpiar storage y redirigir después de 3 segundos
      setTimeout(() => {
        localStorage.removeItem('quarto_inventory');
        localStorage.removeItem('quarto_inventory_photos');
        localStorage.removeItem('quarto_logistics_method');
        localStorage.removeItem('quarto_transport');
        localStorage.removeItem('quarto_user');
        localStorage.removeItem('quarto_booking_contact');

        setIsLoading(false);
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      alert('Ocurrió un error. Intenta de nuevo más tarde.');
    }
  };

  const isFormValid = name.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && !emailError && !phoneError;

  return (
    <div className="min-h-screen flex flex-col ">
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="Solicita tu cotización"
          subtitle="Déjanos tus datos y te enviaremos una cotización personalizada."
        />

        <div className="mt-4 bg-white rounded-3xl shadow-lg border border-slate-200 p-6 sm:p-8">
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                icon={<ArrowLeftIcon className="w-5 h-5" />}
                className="sm:w-40 !py-2.5"
                disabled={isLoading}
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="flex-1 sm:flex-none sm:w-48 !py-2.5 font-bold shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Guardando...' : 'Solicitar Cotización'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cotización Guardada!</h2>
            <p className="text-slate-600 mb-6">
              Hemos recibido tu solicitud. En breve recibirás un correo a <strong>{email}</strong> con tu cotización personalizada y un botón para agendar tu servicio.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
              <span>Redirigiendo en unos segundos...</span>
            </div>
          </div>
        </div>
      )}

      {/* Pantalla de carga */}
      {isLoading && !showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-[#0B5FFF] rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Procesando tu cotización...</h2>
            <p className="text-slate-600 text-sm">Por favor espera mientras guardamos tus datos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequestScreen;
