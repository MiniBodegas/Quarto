import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Card from './ui/Card';
import Button from './ui/Button';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';

const UserLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('check-email'); // 'check-email' | 'login' | 'create-password' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const checkEmailExists = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Verificar si existe en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', email)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        // Usuario no existe ni en users, mostrar opción de registro
        setStep('signup');
        setLoading(false);
        return;
      }

      // 2. Usuario existe en tabla users
      // Verificar si el ID del usuario es un UUID válido de Supabase Auth
      // Los usuarios migrados tienen IDs generados por la BD, no por Auth
      const isAuthUUID = userData.id && userData.id.length === 36 && userData.id.includes('-');
      
      if (!isAuthUUID) {
        // ID no es de Auth = usuario migrado sin contraseña
        setStep('create-password');
        setMessage('✨ Primera vez aquí. Crea tu contraseña para acceder.');
        setLoading(false);
        return;
      }

      // 3. Intentar login con contraseña incorrecta para verificar si existe en Auth
      const { error: testError } = await supabase.auth.signInWithPassword({
        email: email,
        password: '___impossible_password_test_123___',
      });

      if (testError) {
        const errorMsg = testError.message.toLowerCase();
        console.log('[UserLogin] Error de prueba auth:', testError.message);
        
        if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid password')) {
          // "Invalid login credentials" = usuario EXISTE en Auth, solo la contraseña es incorrecta
          console.log('[UserLogin] ✅ Usuario tiene Auth, ir a login');
          setStep('login');
        } else if (errorMsg.includes('email not confirmed')) {
          // Email no confirmado, pero usuario existe
          console.log('[UserLogin] ✅ Usuario existe pero email no confirmado, ir a login');
          setStep('login');
        } else if (errorMsg.includes('user not found') || errorMsg.includes('not registered')) {
          // Usuario NO existe en Auth (migrado)
          console.log('[UserLogin] ⚠️ Usuario migrado sin Auth, crear contraseña');
          setStep('create-password');
          setMessage('✨ Primera vez aquí. Crea tu contraseña para acceder.');
        } else {
          // Cualquier otro error, asumir que tiene Auth y puede hacer login
          console.log('[UserLogin] Error inesperado, asumiendo usuario con auth:', errorMsg);
          setStep('login');
        }
      } else {
        // No debería llegar aquí (login exitoso con contraseña falsa?!)
        console.log('[UserLogin] ⚠️ Login exitoso con password de prueba?!');
        await supabase.auth.signOut();
        setStep('login');
      }
    } catch (err) {
      console.error('[UserLogin] Error verificando email:', err);
      setError('Error al verificar el email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('[UserLogin] Login exitoso:', data);
      setMessage('¡Bienvenido de nuevo!');
      
      // Redirigir al portal de usuario
      setTimeout(() => {
        navigate('/user');
      }, 500);
    } catch (error) {
      console.error('[UserLogin] Error en login:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone,
          }
        }
      });

      if (authError) throw authError;

      // 2. Crear usuario en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          phone: phone,
        });

      if (userError) throw userError;

      console.log('[UserLogin] Registro exitoso:', authData);
      setMessage('✅ ¡Cuenta creada! Redirigiendo...');
      
      // Redirigir al portal
      setTimeout(() => {
        navigate('/user');
      }, 1500);
    } catch (error) {
      console.error('[UserLogin] Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('❌ Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('❌ La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // 1. Obtener datos del usuario de la tabla users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userDataError) throw userDataError;

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      // 3. Actualizar el ID en la tabla users con el ID de Auth
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', email);

      if (updateError) {
        console.warn('[UserLogin] No se pudo actualizar user_id:', updateError);
      }

      // 4. Login automático
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) throw loginError;

      console.log('[UserLogin] Contraseña creada y login exitoso');
      setMessage('✅ ¡Contraseña creada! Redirigiendo...');
      
      // Redirigir al portal
      setTimeout(() => {
        navigate('/user');
      }, 1500);
    } catch (error) {
      console.error('[UserLogin] Error creando contraseña:', error);
      setError(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar según el paso actual
  const renderContent = () => {
    // Paso 1: Verificar email
    if (step === 'check-email') {
      return (
        <>
          <div className="text-center mb-8">
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary">Acceso Cliente</h2>
            <p className="mt-2 text-text-secondary">Ingresa tu email para continuar</p>
          </div>

          <Card className="p-8">
            <form onSubmit={checkEmailExists}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Continuar'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a href="/" className="text-sm text-text-secondary hover:text-text-primary">
                ← Volver al inicio
              </a>
            </div>
          </Card>
        </>
      );
    }

    // Paso 2: Login (usuario con contraseña)
    if (step === 'login') {
      return (
        <>
          <div className="text-center mb-8">
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary">Iniciar Sesión</h2>
            <p className="mt-2 text-text-secondary">Ingresa tu contraseña</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-black border border-border rounded-lg"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep('check-email');
                  setPassword('');
                  setError('');
                  setMessage('');
                }}
                className="text-sm text-primary hover:underline"
              >
                ← Cambiar email
              </button>
            </div>
          </Card>
        </>
      );
    }

    // Paso 3: Crear contraseña (usuario migrado sin contraseña)
    if (step === 'create-password') {
      return (
        <>
          <div className="text-center mb-8">
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary">Crear Contraseña</h2>
            <p className="mt-2 text-text-secondary">Configura tu contraseña para acceder</p>
          </div>

          <Card className="p-8">
            {message && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleCreatePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-black border border-border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <p className="text-xs text-text-secondary mt-1">Mínimo 6 caracteres</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Contraseña'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep('check-email');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                  setMessage('');
                }}
                className="text-sm text-primary hover:underline"
              >
                ← Cambiar email
              </button>
            </div>
          </Card>
        </>
      );
    }

    // Paso 4: Registro completo (usuario nuevo)
    if (step === 'signup') {
      return (
        <>
          <div className="text-center mb-8">
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary">Crear Cuenta</h2>
            <p className="mt-2 text-text-secondary">Regístrate para gestionar tus reservas</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSignup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-black border border-border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-white text-black border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <p className="text-xs text-text-secondary mt-1">Mínimo 6 caracteres</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep('check-email');
                  setName('');
                  setPhone('');
                  setPassword('');
                  setError('');
                  setMessage('');
                }}
                className="text-sm text-primary hover:underline"
              >
                ← Cambiar email
              </button>
            </div>
          </Card>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent z-0"></div>
      
      <div className="max-w-md w-full z-10">
        {renderContent()}

        <p className="text-center text-xs text-text-secondary mt-8 opacity-60">
          Quarto Storage Solutions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
