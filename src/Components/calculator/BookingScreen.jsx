import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "./icons";
import { ScreenHeader, Button, Input, Select } from "../index";
import { supabase } from "../../supabase";

const DOCUMENT_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PP", label: "Pasaporte" },
];

const TIME_SLOTS = [
  { value: "AM", label: "Mañana (8am - 12pm)" },
  { value: "PM", label: "Tarde (1pm - 5pm)" },
];

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const BookingScreen = ({
  totalVolume,
  totalItems,
  logisticsMethod,
  transportPrice,
  totalPriceCOP, // ✅ precio mensual por volumen (viene de tu FinalSummary)
  onBack,
  onGoToPayment, // ✅ callback para ir a pago (Calculator: set wompi + navigate payment)
}) => {
  const [bookingType, setBookingType] = useState("person");
  const [companyName, setCompanyName] = useState("");
  const [companyNit, setCompanyNit] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [documentNumber, setDocumentNumber] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0].value);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [touched, setTouched] = useState({ email: false, phone: false });
  
  // ✅ Estado para modal de confirmación
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // ✅ Cargar datos del formulario desde localStorage al montar
  useEffect(() => {
    const savedFormData = JSON.parse(localStorage.getItem("quarto_booking_form") || "{}");
    
    if (Object.keys(savedFormData).length > 0) {
      // Si hay datos guardados, restaurar todo el formulario
      if (savedFormData.bookingType) setBookingType(savedFormData.bookingType);
      if (savedFormData.companyName) setCompanyName(savedFormData.companyName);
      if (savedFormData.companyNit) setCompanyNit(savedFormData.companyNit);
      if (savedFormData.name) setName(savedFormData.name);
      if (savedFormData.email) setEmail(savedFormData.email);
      if (savedFormData.phone) setPhone(savedFormData.phone);
      if (savedFormData.documentType) setDocumentType(savedFormData.documentType);
      if (savedFormData.documentNumber) setDocumentNumber(savedFormData.documentNumber);
      if (savedFormData.date) setDate(savedFormData.date);
      if (savedFormData.timeSlot) setTimeSlot(savedFormData.timeSlot);
      
      console.log('[BookingScreen] 📋 Formulario restaurado desde localStorage');
    } else {
      // Si no hay formulario guardado, cargar solo datos básicos del usuario
      const userData = JSON.parse(localStorage.getItem("quarto_user") || "{}");
      if (userData.name) setName(userData.name);
      if (userData.email) setEmail(userData.email);
      if (userData.phone) setPhone(userData.phone);
      
      console.log('[BookingScreen] 👤 Datos de usuario cargados');
    }
  }, []);

  // ✅ Guardar el formulario en localStorage cada vez que cambien los datos
  useEffect(() => {
    const formData = {
      bookingType,
      companyName,
      companyNit,
      name,
      email,
      phone,
      documentType,
      documentNumber,
      date,
      timeSlot,
    };
    
    localStorage.setItem("quarto_booking_form", JSON.stringify(formData));
  }, [bookingType, companyName, companyNit, name, email, phone, documentType, documentNumber, date, timeSlot]);

  const loadFromLocalStorage = () => {
    try {
      const inventory = JSON.parse(localStorage.getItem("quarto_inventory") || "[]");
      const logisticsMethodLS = localStorage.getItem("quarto_logistics_method") || null;
      const transport = JSON.parse(localStorage.getItem("quarto_transport") || "null");
      return { inventory, logisticsMethodLS, transport };
    } catch (error) {
      console.error("[Booking] Error leyendo localStorage:", error);
      return { inventory: [], logisticsMethodLS: null, transport: null };
    }
  };

  const validateEmail = (value) => {
    if (!value) return setEmailError("El correo es obligatorio."), false;
    if (!/\S+@\S+\.\S+/.test(value)) return setEmailError("Por favor, introduce un formato de correo válido."), false;
    setEmailError("");
    return true;
  };

  const validatePhone = (value) => {
    if (!value) return setPhoneError("El teléfono es obligatorio."), false;
    if (value.length !== 10) return setPhoneError("El teléfono debe tener 10 dígitos."), false;
    setPhoneError("");
    return true;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") validateEmail(email);
    if (field === "phone") validatePhone(phone);
  };

  const handleEmailChange = (e) => {
    const v = e.target.value;
    setEmail(v);
    if (touched.email) validateEmail(v);
  };

  const handlePhoneChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (v.length <= 10) {
      setPhone(v);
      if (touched.phone) validatePhone(v);
    }
  };

  const handleDocumentNumberChange = (e) => setDocumentNumber(e.target.value.replace(/\D/g, ""));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validaciones
    const isNameValid = name.trim() !== "";
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isDocumentValid = documentNumber.trim() !== "";
    const isDateValid = date.trim() !== "";
    const isTimeSlotValid = timeSlot.trim() !== "";
    const isCompanyDataValid = bookingType === "person" || (companyName.trim() !== "" && companyNit.trim() !== "");

    setTouched({ email: true, phone: true });

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isDocumentValid || !isDateValid || !isTimeSlotValid || !isCompanyDataValid) {
      if (!isNameValid) alert("Por favor, ingresa tu nombre completo.");
      if (!isDocumentValid) alert("Por favor, ingresa tu número de documento.");
      if (!isDateValid) alert("Por favor, selecciona una fecha.");
      if (!isTimeSlotValid) alert("Por favor, selecciona una franja horaria.");
      if (bookingType === "company") {
        if (companyName.trim() === "") alert("Por favor, ingresa el nombre de la empresa.");
        else if (companyNit.trim() === "") alert("Por favor, ingresa el NIT de la empresa.");
      }
      return;
    }

    const { inventory, logisticsMethodLS, transport } = loadFromLocalStorage();
    const finalLogisticsMethod = logisticsMethodLS || logisticsMethod;

    const finalTotalItems =
      totalItems && totalItems > 0 ? totalItems : inventory.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

    const finalTotalVolume =
      totalVolume && totalVolume > 0 ? totalVolume : inventory.reduce((sum, item) => sum + (item.volume ?? 0) * (item.quantity ?? 1), 0);

    const transportCOP =
      finalLogisticsMethod === "En bodega" ? 0 : (transport?.transport_price ?? transportPrice ?? 0);

    // ✅ Tu precio mensual por volumen viene de afuera (FinalSummary)
    const baseMonthlyCOP = Number(totalPriceCOP ?? 0);

    // ✅ Validar que baseMonthlyCOP no sea 0
    if (baseMonthlyCOP === 0) {
      console.error("[Booking] ⚠️ ERROR: totalPriceCOP es 0 o undefined");
      alert("Error: No se pudo calcular el precio. Por favor, verifica tu cotización.");
      return;
    }

    // ✅ Define qué cobras hoy:
    // Opción A (recomendada para tu UI): primer pago = mensualidad + transporte (si aplica)
    const totalToPayCOP = baseMonthlyCOP + transportCOP;

    console.group("[Booking] Payload + precios");
    console.log("baseMonthlyCOP:", baseMonthlyCOP);
    console.log("transportCOP:", transportCOP);
    console.log("totalToPayCOP:", totalToPayCOP);
    console.log("finalTotalItems:", finalTotalItems);
    console.log("finalTotalVolume:", finalTotalVolume);
    console.groupEnd();

    try {
      // 1) Upsert usuario por email
      let userId = null;
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
        await supabase.from("users").update({ name, phone }).eq("id", userId);
      } else {
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert([{ name, email, phone }])
          .select()
          .single();

        if (userError) {
          console.error("[Booking] Error creando usuario:", userError);
          alert("No pudimos crear el usuario");
          return;
        }
        userId = newUser.id;
      }

      // 2) Inserta o recupera booking existente
      let bookingId = localStorage.getItem('quarto_current_booking_id');
      let booking = null;

      if (bookingId) {
        // ✅ Verificar si el booking existe
        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (existingBooking) {
          console.log("[Booking] ♻️ Reutilizando booking existente:", bookingId);
          booking = existingBooking;
          
          // Actualizar datos si cambiaron
          await supabase
            .from("bookings")
            .update({
              name,
              phone,
              document_type: documentType,
              document_number: documentNumber,
              date,
              time_slot: timeSlot,
            })
            .eq("id", bookingId);
        } else {
          bookingId = null; // Booking ya no existe, crear uno nuevo
        }
      }

      if (!bookingId) {
        // ✅ Crear nuevo booking
        const bookingPayload = {
          user_id: userId,
          booking_type: bookingType,
          company_name: bookingType === "company" ? companyName : null,
          company_nit: bookingType === "company" ? companyNit : null,
          name,
          email,
          phone,
          document_type: documentType,
          document_number: documentNumber,
          date,
          time_slot: timeSlot,
          total_volume: finalTotalVolume,
          total_items: finalTotalItems,
          logistics_method: finalLogisticsMethod,
          transport_price: transportCOP,
          amount_total: totalToPayCOP, // ✅ Guardar precio total desde el inicio
          amount_monthly: baseMonthlyCOP, // ✅ Guardar precio mensual desde el inicio
          payment_status: "PENDING", // ✅ Estado inicial
        };

        console.log("[Booking] 📝 Creando nuevo booking con payload:", bookingPayload);

        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert([bookingPayload])
          .select()
          .single();

        if (bookingError) {
          console.error("[Booking] Error guardando booking:", bookingError);
          alert("Error al guardar la reserva: " + bookingError.message);
          return;
        }

        booking = newBooking;
        bookingId = newBooking.id;
        
        // ✅ Guardar booking ID en localStorage
        localStorage.setItem('quarto_current_booking_id', bookingId);
        console.log("[Booking] 🆕 Nuevo booking creado:", bookingId);
      }

      // 2.1) Generar token interno único para este booking
      const internalToken = `TOKEN_${bookingId}_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      // 2.2) Generar referencia Wompi (se usará cuando el usuario pague)
      const wompiReference = `QUARTO_${bookingId}_${Date.now()}`;

      // 2.3) Actualizar booking con estado pendiente, token y monto a pagar
      console.log("[Booking] 💰 Guardando precios:", {
        amount_total: totalToPayCOP,
        amount_monthly: baseMonthlyCOP,
        transport_price: transportCOP
      });

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "PENDING",
          wompi_reference: wompiReference,
          internal_token: internalToken,
          amount_total: totalToPayCOP,
          amount_monthly: baseMonthlyCOP,
        })
        .eq("id", bookingId);
      
      if (updateError) {
        console.error("[Booking] Error actualizando booking:", updateError);
        alert("Error al actualizar la reserva: " + updateError.message);
        return;
      }
      
      console.log("[Booking] ✅ Token interno generado:", internalToken);
      console.log("[Booking] ✅ Precios guardados correctamente");

      // 3) Si hay transport asociado, linkear booking_id
      if (transport?.id) {
        const { error: transportUpdateError } = await supabase
          .from("transports")
          .update({ booking_id: bookingId })
          .eq("id", transport.id);

        if (transportUpdateError) {
          console.warn("[Booking] No se pudo linkear transport:", transportUpdateError);
        }
      }

      // 4) Inventory (si viene de quoteId: actualiza; si no: inserta)
      const quoteId = new URLSearchParams(window.location.search).get("quoteId");

      if (quoteId) {
        // ✅ Actualizar inventory de la cotización para asociarlo a la reserva
        // Mantenemos el quote_id para trazabilidad y agregamos el booking_id
        const { error: updateInventoryError } = await supabase
          .from("inventory")
          .update({ booking_id: bookingId })
          .eq("quote_id", quoteId)
          .is("booking_id", null);

        if (updateInventoryError) {
          console.warn("[Booking] updateInventoryError:", updateInventoryError);
        } else {
          console.log("[Booking] ✅ Inventario de cotización actualizado con booking_id");
        }
      } else {
        // ✅ Verificar si ya hay inventario asociado a este booking
        const { data: existingInventory } = await supabase
          .from("inventory")
          .select("id")
          .eq("booking_id", bookingId)
          .limit(1);

        if (existingInventory && existingInventory.length > 0) {
          console.log("[Booking] ⚠️ Inventario ya existe para este booking, saltando inserción");
        } else {
          const inv = JSON.parse(localStorage.getItem("quarto_inventory") || "[]");
          console.log("[Booking] 📦 Insertando", inv.length, "items al inventario");

          for (const item of inv) {
            let customItemId = null;

            if (item.isCustom) {
              const { data: customData, error: customError } = await supabase
                .from("custom_items")
                .insert([{
                  name: item.name,
                  width: item.width,
                  height: item.height,
                  depth: item.depth,
                  volume: item.volume,
                }])
                .select()
                .single();

              if (customError) {
                console.warn("[Booking] customError:", customError);
                continue;
              }

              customItemId = customData.id;
              await supabase.from("custom_items").update({ user_id: userId }).eq("id", customItemId);
            }

            const inventoryPayload = {
              booking_id: bookingId,
              item_id: !item.isCustom && item.id && typeof item.id === "string" && item.id.match(/^[0-9a-f-]{36}$/i) ? item.id : null,
              custom_item_id: customItemId,
              name: item.name,
              quantity: Number(item.quantity ?? 1),
              volume: Number(item.volume ?? 0),
              is_custom: item.isCustom ?? false,
              short_code: generateShortCode(),
            };

            const { error: invError } = await supabase.from("inventory").insert([inventoryPayload]);
            if (invError) {
              console.error("[Booking] Error inventory:", invError);
              alert("No pudimos guardar el inventario. Intenta de nuevo.");
              return;
            }
          }
          
          console.log("[Booking] ✅ Inventario guardado exitosamente");
        }
      }

      // 5) Guardar contacto y token para acceso posterior
      localStorage.setItem("quarto_booking_contact", JSON.stringify({ 
        name, 
        email, 
        phone,
        bookingId,
        internalToken 
      }));

      // 6) Mostrar confirmación exitosa
      console.log("[Booking] ✅ Reserva creada exitosamente");
      console.log("[Booking] 📋 Booking ID:", bookingId);
      console.log("[Booking] 🔑 Token:", internalToken);
      console.log("[Booking] ℹ️  La factura se generará automáticamente después del pago con Wompi");
      
      // ✅ Guardar datos para el modal y mostrarlo
      setSuccessData({
        bookingId,
        internalToken,
        name,
        email,
        date,
        timeSlot
      });
      setShowSuccessModal(true);

    } catch (err) {
      console.error("[Booking] Error inesperado:", err);
      alert("Ocurrió un error al guardar tu reserva.");
    }
  };

  // ✅ Función para cerrar modal y redirigir
  const handleModalClose = () => {
    // Limpiar formulario y datos temporales
    localStorage.removeItem('quarto_booking_form');
    localStorage.removeItem('quarto_inventory');
    localStorage.removeItem('quarto_transport');
    localStorage.removeItem('quarto_logistics_method');
    
    // Redirigir al registro/login con el bookingId
    window.location.href = `/payment-success?booking_id=${successData.bookingId}`;
  };

  const isFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    documentNumber.trim() !== "" &&
    date.trim() !== "" &&
    timeSlot.trim() !== "" &&
    !emailError &&
    !phoneError &&
    (bookingType === "person" || (companyName.trim() !== "" && companyNit.trim() !== ""));

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col ">
      {/* ✅ Modal de confirmación exitosa */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Icono de éxito */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-3xl font-bold text-center text-[#012E58] mb-3">
              ¡Reserva Confirmada! 🎉
            </h2>

            {/* Mensaje */}
            <p className="text-center text-slate-600 mb-6">
              Tu reserva ha sido creada exitosamente
            </p>

            {/* Detalles */}
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 font-medium">ID de Reserva:</span>
                <span className="text-xs font-mono font-semibold text-[#012E58] break-all">
                  {successData.bookingId}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500 font-medium">Cliente:</span>
                <span className="text-sm font-semibold text-slate-700 text-right">
                  {successData.name}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500 font-medium">Email:</span>
                <span className="text-sm font-medium text-slate-700 text-right break-all">
                  {successData.email}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500 font-medium">Fecha:</span>
                <span className="text-sm font-semibold text-slate-700">
                  {new Date(successData.date).toLocaleDateString('es-CO', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500 font-medium">Horario:</span>
                <span className="text-sm font-semibold text-slate-700">
                  {TIME_SLOTS.find(slot => slot.value === successData.timeSlot)?.label || successData.timeSlot}
                </span>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-bold text-[#012E58] mb-2">Próximos pasos:</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Crea una cuenta para gestionar tu reserva</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Realiza el pago desde tu perfil cuando estés listo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Accede a tu inventario y gestiona tu almacenamiento</span>
                </li>
              </ul>
            </div>

            {/* Botón de continuar */}
            <button
              onClick={handleModalClose}
              className="w-full bg-gradient-to-r from-[#012E58] to-[#014c91] text-white font-bold py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Continuar al Registro
            </button>
          </div>
        </div>
      )}

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

              {bookingType === "company" && (
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
                    onChange={(e) => setCompanyNit(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 900123456"
                    required
                  />
                </div>
              )}

              <Input
                id="name"
                label={bookingType === "company" ? "Nombre completo (contacto)" : "Nombre completo"}
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
                onBlur={() => handleBlur("email")}
                placeholder="Ej: ana.maria@correo.com"
                required
                autoComplete="email"
                error={touched.email ? emailError : ""}
              />

              <Input
                id="phone"
                label="Teléfono"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                placeholder="Ej: 3001234567"
                required
                autoComplete="tel"
                maxLength={10}
                error={touched.phone ? phoneError : ""}
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
                  label={logisticsMethod === "Recogida" ? "Fecha de Recogida" : "Fecha de Llegada a Bodega"}
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
