import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './icons';
import { ScreenHeader, Button, Input, Select } from '../index';
import { supabase } from '../../supabase'; // 👈 IMPORTANTE

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PP', label: 'Pasaporte' },
];

const TIME_SLOTS = [
  { value: 'AM', label: 'Mañana (8am - 12pm)' },
  { value: 'PM', label: 'Tarde (1pm - 5pm)' },
];

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function base64ToBlob(base64) {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

const BookingScreen = ({
  totalVolume,
  totalItems,
  logisticsMethod,
  transportPrice,
  onBack,
  onConfirm,
}) => {
  const [bookingType, setBookingType] = useState('person');
  const [companyName, setCompanyName] = useState('');
  const [companyNit, setCompanyNit] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [documentNumber, setDocumentNumber] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0].value);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [touched, setTouched] = useState({ email: false, phone: false });

  useEffect(() => {
    // Prellena datos si vienen del email
    const userData = JSON.parse(localStorage.getItem('quarto_user') || '{}');
    if (userData.name) setName(userData.name);
    if (userData.email) setEmail(userData.email);
    if (userData.phone) setPhone(userData.phone);
  }, []);

  // CALCULA totales desde localStorage (para ambos flujos)
  useEffect(() => {
    const inventory = JSON.parse(localStorage.getItem('quarto_inventory') || '[]');
    if (inventory.length > 0 && totalItems === 0) {
      // Si viene de quoteId, el hook ya cargó los items
      // Si viene de flujo directo, recalcula desde localStorage
      const calculatedItems = inventory.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
      const calculatedVolume = inventory.reduce((sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1), 0);
      console.log('Items calculados:', calculatedItems, 'Volumen:', calculatedVolume);
    }
  }, [totalItems]);

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

  const handleDocumentNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setDocumentNumber(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isNameValid = name.trim() !== '';
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isDocumentValid = documentNumber.trim() !== '';
    const isDateValid = date.trim() !== '';
    const isTimeSlotValid = timeSlot.trim() !== '';
    const isCompanyDataValid =
      bookingType === 'person' || (companyName.trim() !== '' && companyNit.trim() !== '');

    setTouched({ email: true, phone: true });

    if (
      !isNameValid ||
      !isEmailValid ||
      !isPhoneValid ||
      !isDocumentValid ||
      !isDateValid ||
      !isTimeSlotValid ||
      !isCompanyDataValid
    ) {
      if (!isNameValid) alert('Por favor, ingresa tu nombre completo.');
      if (!isDocumentValid) alert('Por favor, ingresa tu número de documento.');
      if (!isDateValid) alert('Por favor, selecciona una fecha.');
      if (!isTimeSlotValid) alert('Por favor, selecciona una franja horaria.');
      if (bookingType === 'company') {
        if (companyName.trim() === '') alert('Por favor, ingresa el nombre de la empresa.');
        else if (companyNit.trim() === '') alert('Por favor, ingresa el NIT de la empresa.');
      }
      return;
    }

    const { inventory, logisticsMethodLS, transport } = loadFromLocalStorage();

    const finalLogisticsMethod = logisticsMethodLS || logisticsMethod;
    // IMPORTANTE: Usa inventory.length como fallback si totalItems es 0
    const finalTotalItems = 
      totalItems && totalItems > 0 
        ? totalItems 
        : inventory.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    
    const finalTotalVolume = 
      totalVolume && totalVolume > 0
        ? totalVolume
        : inventory.reduce((sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1), 0);

    const bookingPayload = {
      booking_type: bookingType,
      company_name: bookingType === 'company' ? companyName : null,
      company_nit: bookingType === 'company' ? companyNit : null,
      name,
      email,
      phone,
      document_type: documentType,
      document_number: documentNumber,
      date,
      time_slot: timeSlot,
      total_items: finalTotalItems,
      total_volume: finalTotalVolume,
      logistics_method: finalLogisticsMethod,
      transport_price:
        finalLogisticsMethod === 'En bodega' 
          ? 0 
          : transport?.transport_price ?? transportPrice ?? 0,
    };

    console.log('Guardando reserva:', bookingPayload);

    try {
      // 1) Upsert usuario por email (evita error 409)
      let userId = null;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
        // Actualiza los datos si ya existe
        await supabase.from('users').update({ name, phone }).eq('id', userId);
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{ name, email, phone }])
          .select()
          .single();
        if (userError) {
          console.error('Error usuario:', userError);
          alert('No pudimos crear el usuario');
          return;
        }
        userId = newUser.id;
      }

      // 2) Inserta la reserva con TODOS los datos del payload
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: userId,
          booking_type: bookingPayload.booking_type,
          company_name: bookingPayload.company_name,
          company_nit: bookingPayload.company_nit,
          name: bookingPayload.name,
          email: bookingPayload.email,
          phone: bookingPayload.phone,
          document_type: bookingPayload.document_type,
          document_number: bookingPayload.document_number,
          date: bookingPayload.date,
          time_slot: bookingPayload.time_slot,
          total_volume: bookingPayload.total_volume,
          total_items: bookingPayload.total_items,
          logistics_method: bookingPayload.logistics_method,
          transport_price: bookingPayload.transport_price,
        }])
        .select()
        .single();
      
      if (bookingError) {
        console.error('Error en booking:', bookingError);
        alert('Error al guardar la reserva: ' + bookingError.message);
        return;
      }
      const bookingId = booking.id;

      // Después de crear la reserva, busca transportId si existe
      let transportId = null;
      if (transport?.id) {
        transportId = transport.id;
      }

      if (transportId) {
        await supabase.from('transports').update({ booking_id: bookingId }).eq('id', transportId);
      }

      const inv = JSON.parse(localStorage.getItem('quarto_inventory') || '[]');
      for (const item of inv) {
        let customItemId = null;

        if (item.isCustom) {
          const { data: customData, error: customError } = await supabase
            .from('custom_items')
            .insert([
              {
                name: item.name,
                width: item.width,
                height: item.height,
                depth: item.depth,
                volume: item.volume,
              },
            ])
            .select()
            .single();

          if (customError) {
            console.error('Error al guardar custom item:', customError);
            continue;
          }
          customItemId = customData.id;

          if (userId) {
            await supabase.from('custom_items').update({ user_id: userId }).eq('id', customItemId);
          }
        }

        const quantity = Number(item.quantity ?? 1);
        const volume = Number(item.volume ?? 0);

        const inventoryPayload = {
          booking_id: bookingId,
          item_id: !item.isCustom && item.id && typeof item.id === 'string' && item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? item.id : null,
          custom_item_id: customItemId,
          name: item.name,
          quantity,
          volume,
          is_custom: item.isCustom ?? false,
          short_code: generateShortCode(),
        };

        const { error: invError } = await supabase.from('inventory').insert([inventoryPayload]);
        if (invError) {
          console.error('Error al guardar inventory:', invError);
          alert('No pudimos guardar el inventario. Intenta de nuevo.');
          return;
        }
      }

      localStorage.setItem('quarto_booking_contact', JSON.stringify({ name, email, phone }));
      onConfirm(name);
    } catch (err) {
      console.error('Error inesperado al guardar la reserva:', err);
      alert('Ocurrió un error al guardar tu reserva.');
    }
  };

  const isFormValid =
    name.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    documentNumber.trim() !== '' &&
    date.trim() !== '' &&
    timeSlot.trim() !== '' &&
    !emailError &&
    !phoneError &&
    (bookingType === 'person' || (companyName.trim() !== '' && companyNit.trim() !== ''));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex-grow pt-8 pb-12">
        <ScreenHeader
          title="Agenda tu servicio"
          subtitle="Estás a un paso de asegurar tu espacio. Completa tus datos y elige una fecha."
        />

        <div className="mt-4 bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-6">
              <Select
                id="booking-type"
                label="¿El servicio es para?"
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
                className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
              >
                <option value="person">Persona Natural</option>
                <option value="company">Empresa</option>
              </Select>

              {bookingType === 'company' && (
                <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-4">
                  <Input
                    id="companyName"
                    label="Nombre de la empresa"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Mi Empresa S.A.S"
                    required
                  />
                  <Input
                    id="companyNit"
                    label="NIT"
                    type="text"
                    inputMode="numeric"
                    value={companyNit}
                    onChange={(e) => setCompanyNit(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 900123456"
                    required
                  />
                </div>
              )}

              <Input
                id="name"
                label={bookingType === 'company' ? 'Nombre completo (contacto)' : 'Nombre completo'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  id="document-type"
                  label="Tipo de documento"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                  className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
                >
                  {DOCUMENT_TYPES.map((doc) => (
                    <option key={doc.value} value={doc.value}>
                      {doc.label}
                    </option>
                  ))}
                </Select>
                <Input
                  id="document-number"
                  label="Número de documento"
                  type="text"
                  inputMode="numeric"
                  value={documentNumber}
                  onChange={handleDocumentNumberChange}
                  placeholder="Ej: 1234567890"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="date"
                  label={logisticsMethod === 'Recogida' ? 'Fecha de Recogida' : 'Fecha de Llegada a Bodega'}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={today}
                />
                <Select
                  id="time-slot"
                  label="Franja horaria"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                  className="!rounded-lg !px-3 !py-2.5 !text-[#012E58]"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Select>
              </div>
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
                Confirmar Reserva
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookingScreen;
