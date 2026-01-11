import Button from './ui/Button';
import Card from './ui/Card';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';
import { adminLogin } from '../api';

const AdminLogin = ({ onLogin, onGoToClientLogin }) => {
    
    const handleQuickLogin = async () => {
        // Auto-login con credenciales hardcodeadas para desarrollo
        try {
            const result = await adminLogin('admin@quarto.com', 'password123');
            if (result.success) {
                onLogin(result.data); // Navega al panel de admin con los datos
            } else {
                alert('Error en login: ' + (result.message || 'Credenciales inválidas'));
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error de conexión: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center">
                <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-16 w-auto mb-6" />
                <Card className="p-8 shadow-lg">
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">lock_open</span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Acceso Admin</h2>
                    <p className="text-text-secondary mb-8">Modo Rápido de Desarrollo</p>
                    
                    <Button onClick={handleQuickLogin} className="w-full mb-4 py-3 font-bold">
                        Entrar al Panel de Control
                    </Button>
                    
                    <button 
                        onClick={onGoToClientLogin} 
                        className="text-sm text-text-secondary hover:text-primary hover:underline mt-4 flex items-center justify-center mx-auto"
                    >
                        <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                        Volver a selección de rol
                    </button>
                </Card>
            </div>
        </div>
    );
};

export default AdminLogin;
