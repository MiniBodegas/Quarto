import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Card from './ui/Card';
import Button from './ui/Button';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';

/**
 * Componente para completar el registro después de pagar
 * El usuario ya tiene nombre, email, phone en el booking
 */
const CompleteRegistration = ({ bookingData, onSkip }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar contraseñas
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      const { name, email, phone } = bookingData;

      console.log('[CompleteRegistration] Creando cuenta para:', email);

      // 1. Verificar si el usuario ya existe en la tabla users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let userId = existingUser?.id;

      // 2. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
          // No enviar email de confirmación automáticamente
          emailRedirectTo: `${window.location.origin}/user`,
        }
      });

      if (authError) {
        // Si el usuario ya existe en Auth, intentar login
        if (authError.message.includes('already registered')) {
          console.log('[CompleteRegistration] Usuario ya existe, intentando login');
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (loginError) {
            setError('Esta cuenta ya existe. Por favor inicia sesión desde /login');
            setLoading(false);
            return;
          }

          // Login exitoso
          console.log('[CompleteRegistration] Login exitoso');
          navigate('/user');
          return;
        }
        throw authError;
      }

      // 3. Si no existía en la tabla users, crear registro
      if (!userId && authData.user) {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            name,
            phone,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (userError) {
          console.error('[CompleteRegistration] Error creando usuario en DB:', userError);
          // Continuar de todos modos, el usuario se creará en el próximo login
        } else {
          userId = newUser.id;
        }
      }

      // 4. Actualizar el booking con el user_id si no lo tenía
      if (userId && bookingData.id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ user_id: userId })
          .eq('id', bookingData.id);

        if (bookingError) {
          console.error('[CompleteRegistration] Error actualizando booking:', bookingError);
        }
      }

      console.log('[CompleteRegistration] ✅ Cuenta creada exitosamente');
      
      // Redirigir al portal
      setTimeout(() => {
        navigate('/user');
      }, 500);

    } catch (error) {
      console.error('[CompleteRegistration] Error:', error);
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[CompleteRegistration] Usuario saltó el registro');
    if (onSkip) {
      onSkip();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-green-50 to-transparent z-0"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
          
          {/* Icono de éxito */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
          </div>
          
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            ¡Reserva Creada!
          </h2>
          <p className="text-text-secondary mb-4">
            Ahora crea tu cuenta para acceder a tu portal
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium">
              📧 {bookingData.email}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {bookingData.name}
            </p>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Completa tu registro
          </h3>
          <p className="text-sm text-text-secondary">
            Crea una contraseña para acceder a tu portal y gestionar tus reservas
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-800">
              💡 <strong>Importante:</strong> Podrás realizar el pago desde tu portal de usuario
            </p>
          </div>
        </div>

        <Card className="p-8">
          <form onSubmit={handleCompleteRegistration}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Crear contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                placeholder="••••••••"
                autoFocus
              />
              <p className="text-xs text-text-secondary mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mb-3"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta y acceder'
              )}
            </Button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-sm text-text-secondary hover:text-text-primary py-2"
            >
              Hacerlo más tarde
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-text-secondary text-center">
              💡 <strong>Beneficios de crear tu cuenta:</strong>
            </p>
            <ul className="text-xs text-text-secondary mt-2 space-y-1">
              <li>✅ Completa el pago de forma segura con Wompi</li>
              <li>✅ Accede a tu inventario en cualquier momento</li>
              <li>✅ Gestiona tus facturas y pagos</li>
              <li>✅ Agrega personas autorizadas</li>
              <li>✅ Historial completo de tus reservas</li>
            </ul>
          </div>
        </Card>

        <p className="text-center text-xs text-text-secondary mt-8 opacity-60">
          Quarto Storage Solutions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default CompleteRegistration;
