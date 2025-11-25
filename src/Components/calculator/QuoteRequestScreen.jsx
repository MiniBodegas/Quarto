import { useState } from 'react';
import { ArrowLeftIcon } from './icons';
import { calculateStoragePrice } from '../../utils/pricing';
import {Button,Input, ScreenHeader} from '../index';


const QuoteRequestScreen = ({ totalVolume, totalItems, logisticsMethod, transportPrice, selectedItems, onBack }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const storagePrice = calculateStoragePrice(totalVolume);

    const handleSubmit = (e) => {
        e.preventDefault();

        const isNameValid = name.trim() !== '';
        const isEmailValid = validateEmail(email);
        const isPhoneValid = validatePhone(phone);
        
        setTouched({ email: true, phone: true });

        if (!isNameValid || !isEmailValid || !isPhoneValid) {
            if (!isNameValid) alert('Por favor, ingresa tu nombre completo.');
            return;
        }

        const itemList = selectedItems
            .map(item => `• ${item.name} (Cantidad: ${item.quantity}, Volumen: ${(item.volume * item.quantity).toFixed(1)} m³)`).join('\n');
            
        const transportInfo = logisticsMethod === 'Recogida' && transportPrice !== null 
            ? formatCurrency(transportPrice) 
            : 'N/A (Entrega en bodega)';

        const subject = `Cotización de Almacenamiento - Quarto [${name}]`;
        const body = `Hola ${name},

¡Gracias por utilizar nuestra calculadora!

Hemos generado una cotización basada en la información que proporcionaste. Un especialista de nuestro equipo se pondrá en contacto contigo muy pronto para resolver cualquier duda y coordinar los siguientes pasos.

Aquí tienes una copia de tu cotización para tus registros:

========================================
**RESUMEN DE COTIZACIÓN**
========================================

**Tus Datos:**
  •  **Nombre:** ${name}
  •  **Correo:** ${email}
  •  **Teléfono:** ${phone}

**Detalles del Servicio:**
  •  **Método de Logística:** ${logisticsMethod === 'Recogida' ? 'Recogida por Quarto' : 'Entrega directa en bodega'}
  •  **Volumen Total Estimado:** ${totalVolume.toFixed(1)} m³
  •  **Total de Artículos:** ${totalItems}

**Inversión Estimada:**
  •  **Almacenamiento (Mensual):** ${formatCurrency(storagePrice)}
  •  **Transporte (Pago Único):** ${transportInfo}

========================================
**INVENTARIO DETALLADO**
========================================

${itemList}

========================================

Si tienes alguna pregunta, puedes responder a este correo y te atenderemos a la brevedad.

Saludos cordiales,

El equipo de Quarto.`;

        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        alert('Tu cotización ha sido generada y se abrirá en tu cliente de correo. ¡Gracias!');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 flex-grow flex flex-col">
                 <ScreenHeader 
                    title="Enviar cotización por correo"
                    subtitle="Completa tus datos para recibir una copia detallada de tu cotización."
                />

                <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto w-full">
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

                    <div className="mt-12 text-center space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
                        <Button type="submit">
                            Enviar cotización
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

export default QuoteRequestScreen;