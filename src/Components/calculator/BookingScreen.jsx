import { useState } from 'react';
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
  // Ejemplo: 6 caracteres alfanuméricos
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
  const [touched, setTouched] = useState({
    email: false,
    phone: false,
  });

  // 🔹 Leer lo que ya tienes del flujo anterior en localStorage
  const loadFromLocalStorage = () => {
    try {
      const inventory = JSON.parse(
        localStorage.getItem('quarto_inventory') || '[]'
      );
      const logisticsMethodLS =
        localStorage.getItem('quarto_logistics_method') || null;
      const transport = JSON.parse(
        localStorage.getItem('quarto_transport') || 'null'
      );

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
      bookingType === 'person' ||
      (companyName.trim() !== '' && companyNit.trim() !== '');

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
      if (!isTimeSlotValid)
        alert('Por favor, selecciona una franja horaria.');
      if (bookingType === 'company') {
        if (companyName.trim() === '')
          alert('Por favor, ingresa el nombre de la empresa.');
        else if (companyNit.trim() === '')
          alert('Por favor, ingresa el NIT de la empresa.');
      }
      return;
    }

    // ✅ Cargar datos del localStorage (inventario, logística, transporte, fotos)
    const { inventory, logisticsMethodLS, transport } = loadFromLocalStorage();
    const photos = JSON.parse(localStorage.getItem('quarto_inventory_photos') || '{}');

    const finalLogisticsMethod = logisticsMethodLS || logisticsMethod;
    const finalTotalItems =
      totalItems ??
      inventory.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    const finalTotalVolume =
      totalVolume ??
      inventory.reduce(
        (sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1),
        0
      );

    // ✅ Construir el payload para Supabase
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
      transport_price: finalLogisticsMethod === 'En bodega' ? 0 : (transport?.transport_price ?? transportPrice ?? null),
    };

    console.log('Guardando reserva en Supabase:', bookingPayload);

    try {
      // 1. Insertar usuario
      const { data: userData } = await supabase
        .from('users')
        .insert([{ name, email, phone }])
        .select()
        .single();
      const userId = userData.id;

      let transportId = null;
      if (logisticsMethod === 'Recogida') {
        // Solo guarda transporte si es recogida
        const { data: transportData, error: transportError } = await supabase
          .from('transports')
          .insert([{ ...transport, user_id: userId }])
          .select()
          .single();
        if (transportError) {
          // manejar error
          return;
        }
        transportId = transportData.id;
      }

      // Al guardar booking, transport_id puede ser null
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([{ ...bookingPayload, user_id: userId, transport_id: transportId }])
        .select()
        .single();
      const bookingId = bookingData.id;

      // 4. (Opcional) Actualizar transporte con booking_id
      if (transportId) {2
        await supabase
          .from('transports')
          .update({ booking_id: bookingId })
          .eq('id', transportId);
      }

      for (const item of inventory) {
        const inventoryPayload = {
          booking_id: bookingId,
          item_id: item.id && /^[0-9a-fA-F-]{36}$/.test(item.id) ? item.id : null,
          name: item.name,
          quantity: item.quantity ?? 1,
          volume: item.volume ?? 0,
          is_custom: item.isCustom ?? false,
          short_code: generateShortCode(),
        };
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .insert([inventoryPayload])
          .select()
          .single();

        if (invError) {
          console.error('Error al insertar en inventory:', invError);
          alert('Error al guardar el inventario. Revisa los datos.');
          break;
        }

        const base64 = photos[item.id];
        console.log('DEBUG - base64:', base64, typeof base64);

        if (base64) {
        const blob = base64ToBlob(base64);
        console.log('DEBUG - Blob:', blob, blob.size, blob.type);

        if (blob.size > 0) {
          const filePath = `booking_${bookingId}/item_${invData.id}.jpg`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Inventory')
            .upload(filePath, blob, { upsert: true });

          console.log('DEBUG - Storage response:', uploadData, uploadError);

          if (uploadError) {
            alert('Error al subir imagen: ' + uploadError.message);
            console.error('Error al subir imagen:', uploadError);
          } else {
            // 1️⃣ Obtener el public URL del archivo
            const { data: publicData } = supabase.storage
              .from('Inventory')
              .getPublicUrl(filePath);

            const publicUrl = publicData?.publicUrl;
            console.log('DEBUG - Public URL:', publicUrl);

            // 2️⃣ Actualizar la fila en la tabla inventory con ese URL
            if (publicUrl) {
              const { error: updateError } = await supabase
                .from('inventory')              // 👈 nombre de tu tabla
                .update({ image_url: publicUrl }) // 👈 cambia image_url si tu columna se llama distinto
                .eq('id', invData.id);           // usamos el id que nos devolvió el insert

              if (updateError) {
                console.error('Error al actualizar inventory con image_url:', updateError);
              }
            }
          }
        }
      }
      }

      // Opcional: guardar algo en localStorage
      localStorage.setItem(
        'quarto_booking_contact',
        JSON.stringify({ name, email, phone })
      );

      // Llamar callback para que el flujo siga
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
    (bookingType === 'person' ||
      (companyName.trim() !== '' && companyNit.trim() !== ''));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto max-w-lg p-4 sm:p-6 lg:p-8 flex-grow flex flex-col justify-center">
        <ScreenHeader
          title="Agenda tu servicio"
          subtitle="Estás a un paso de asegurar tu espacio. Completa tus datos y elige una fecha."
        />

        <form onSubmit={handleSubmit} className="space-y-8 w-full">
          <div className="space-y-6">
            <Select
              id="booking-type"
              label="¿El servicio es para?"
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value)}
            >
              <option value="person">Persona Natural</option>
              <option value="company">Empresa</option>
            </Select>

            {bookingType === 'company' && (
              <div className="space-y-6 bg-muted dark:bg-muted-dark p-4 rounded-xl animate-fade-in">
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
                  onChange={(e) =>
                    setCompanyNit(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="Ej: 900123456"
                  required
                />
              </div>
            )}

            <Input
              id="name"
              label={
                bookingType === 'company'
                  ? 'Nombre completo (contacto)'
                  : 'Nombre completo'
              }
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
                label={
                  logisticsMethod === 'Recogida'
                    ? 'Fecha de Recogida'
                    : 'Fecha de Llegada a Bodega'
                }
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
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="pt-4 text-center space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
            <Button type="submit" disabled={!isFormValid}>
              Confirmar Reserva
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              icon={<ArrowLeftIcon className="w-5 h-5" />}
            >
              Volver
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BookingScreen;
