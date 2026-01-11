import { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';
import { adminLogin } from '../api';

const AdminLogin = ({ onLogin, onGoToClientLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await adminLogin(email, password);
            if (result.success) {
                setEmail('');
                setPassword('');
                onLogin(result.data);
            } else {
                setError(result.message || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Error en login:', error);
            setError('Error de conexión: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-16 w-auto mb-4" />
                    <h1 className="text-3xl font-bold text-text-primary">Quarto Admin</h1>
                </div>

                <Card className="p-8 shadow-lg">
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-primary">security</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Acceso Admin</h2>
                    <p className="text-text-secondary mb-6 text-center">Solo para administradores autorizados</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Correo Electrónico
                            </label>
                            <Input
                                type="email"
                                placeholder="admin@quarto.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Contraseña
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full py-3 font-bold mt-6"
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Acceder al Panel'}
                        </Button>
                    </form>

                    <button 
                        onClick={onGoToClientLogin} 
                        className="text-sm text-text-secondary hover:text-primary hover:underline mt-4 w-full flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                        Volver a selección de rol
                    </button>
                </Card>

                <p className="text-xs text-text-secondary text-center mt-4">
                    Acceso restringido solo a administradores
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
