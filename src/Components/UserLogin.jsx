import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Card from './ui/Card';
import Button from './ui/Button';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';

const UserLogin = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
            name,
            phone,
          }
        }
      });

      if (authError) throw authError;

      // 2. Crear registro en tabla users
      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            name,
            phone,
            created_at: new Date().toISOString(),
          }]);

        if (userError) {
          console.error('[UserLogin] Error creando usuario en DB:', userError);
        }
      }

      console.log('[UserLogin] Registro exitoso:', authData);
      setMessage('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
      
      // Limpiar campos
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      
    } catch (error) {
      console.error('[UserLogin] Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent z-0"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-20 w-auto mb-4" />
          <h2 className="text-3xl font-bold text-text-primary">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-text-secondary">
            {isLogin 
              ? 'Accede a tu portal de cliente' 
              : 'Regístrate para gestionar tus reservas'
            }
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={isLogin ? handleLogin : handleSignup}>
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Juan Pérez"
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
                    required={!isLogin}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="tu@email.com"
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
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-text-secondary mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
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

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate aquí' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              ← Volver al inicio
            </a>
          </div>
        </Card>

        <p className="text-center text-xs text-text-secondary mt-8 opacity-60">
          Quarto Storage Solutions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
