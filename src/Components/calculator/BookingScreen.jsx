import { useState } from 'react';
import { ArrowLeftIcon } from './icons';
import { ScreenHeader, Button, Input, Select } from '../index';

const DOCUMENT_TYPES = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PP', label: 'Pasaporte' },
];

const TIME_SLOTS = [
    { value: 'AM', label: 'Mañana (8am - 12pm)' },
    { value: 'PM', label: 'Tarde (1pm - 5pm)' },
];

const BookingScreen = ({ totalVolume, totalItems, logisticsMethod, transportPrice, onBack, onConfirm }) => {
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

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
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
        if (touched.email) {
            validateEmail(value);
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setPhone(value);
            if (touched.phone) {
                validatePhone(value);
            }
        }
    };

    const handleDocumentNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setDocumentNumber(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const isNameValid = name.trim() !== '';
        const isEmailValid = validateEmail(email);
        const isPhoneValid = validatePhone(phone);
        const isDocumentValid = documentNumber.trim() !== '';
        const isDateValid = date.trim() !== '';
        const isTimeSlotValid = timeSlot.trim() !== '';
        const isCompanyDataValid = bookingType === 'person' || (companyName.trim() !== '' && companyNit.trim() !== '');

        setTouched({ email: true, phone: true });

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isDocumentValid || !isDateValid || !isTimeSlotValid || !isCompanyDataValid) {
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

        console.log({ bookingType, companyName, companyNit, name, email, phone, documentType, documentNumber, date, timeSlot, totalVolume, totalItems, logisticsMethod, transportPrice });
        onConfirm(name);
    };

    const isFormValid = name.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && documentNumber.trim() !== '' && date.trim() !== '' && timeSlot.trim() !== '' && !emailError && !phoneError && (bookingType === 'person' || (companyName.trim() !== '' && companyNit.trim() !== ''));

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
                            onChange={e => setBookingType(e.target.value)}
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
                                onChange={e => setDocumentType(e.target.value)}
                                required
                            >
                                {DOCUMENT_TYPES.map(doc => (
                                    <option key={doc.value} value={doc.value}>{doc.label}</option>
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
                                onChange={e => setTimeSlot(e.target.value)}
                                required
                            >
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot.value} value={slot.value}>{slot.label}</option>
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
                            icon={<ArrowLeftIcon className="w-5 h-5"/>}
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