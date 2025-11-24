import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';

const Auth = ({ onLogin, onAdminClick, companyProfiles, loginUsers }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent z-0"></div>
      
      <div className="max-w-5xl w-full space-y-8 z-10">
        <div className="text-center space-y-4">
          <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="mx-auto h-24 w-auto drop-shadow-sm" />
          <div>
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">Bienvenido al Portal</h2>
              <p className="mt-2 text-text-secondary">Seleccione su perfil para ingresar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Sección de Administrador */}
          <div className="group">
            <Card className="h-full flex flex-col items-center p-8 border-2 border-transparent group-hover:border-primary/20 transition-all duration-300 shadow-md group-hover:shadow-xl cursor-pointer" onClick={onAdminClick}>
                <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-5xl text-primary">admin_panel_settings</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Administrativo</h3>
                <p className="text-center text-text-secondary mb-8 flex-1">
                    Acceso al panel de control, gestión de clientes, facturación y configuración global.
                </p>
                <Button className="w-full py-3 text-lg pointer-events-none">
                    Ingresar como Admin
                </Button>
            </Card>
          </div>

          {/* Sección de Clientes */}
          <Card className="flex flex-col p-8 border-2 border-transparent hover:border-green-500/20 transition-all shadow-md hover:shadow-xl relative overflow-hidden">
             <div className="flex flex-col items-center mb-6">
                <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-green-600">person</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Cliente / Usuario</h3>
                <p className="text-center text-text-secondary mb-4">
                    Acceso para visualizar facturas, realizar pagos y gestionar su cuenta.
                </p>
             </div>
             
             <div className="flex-1 w-full overflow-y-auto max-h-[300px] pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Usuarios Disponibles (Demo)</p>
                {loginUsers.map(user => {
                    const company = companyProfiles.find(c => c.id === user.company_id);
                    if (!company) return null;
                    return (
                        <button 
                            key={user.id}
                            onClick={() => onLogin(company, user)}
                            className="w-full text-left p-4 rounded-lg border border-border hover:bg-green-50 hover:border-green-200 transition-all group flex justify-between items-center bg-white"
                        >
                            <div>
                                <div className="font-semibold text-text-primary group-hover:text-green-700">{user.name}</div>
                                <div className="text-xs text-text-secondary mt-0.5 flex items-center">
                                    <span className="material-symbols-outlined text-[14px] mr-1">business</span>
                                    {company.name}
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-300 group-hover:text-green-600 transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    )
                })}
             </div>
          </Card>
        </div>
        
        <p className="text-center text-xs text-text-secondary mt-8 opacity-60">
            Quarto Storage Solutions &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Auth;
