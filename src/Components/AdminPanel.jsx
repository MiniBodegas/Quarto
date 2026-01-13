import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';
import AdminDashboard from './admin/AdminDashboard';
import AdminClients from './admin/AdminClients';
import AdminStorage from './admin/AdminStorage';
import AdminInvoices from './admin/AdminInvoices';
import AdminStatements from './admin/AdminStatements';
import AdminAccessControl from './admin/AdminAccessControl';
import AdminProfile from './admin/AdminProfile';
import AdminManagers from './admin/AdminManagers';
import Spinner from './ui/Spinner';

const AdminHeader = ({ adminUser, onToggleSidebar }) => (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between p-4 h-20 border-b border-border">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-100 md:hidden" aria-label="Abrir menú de navegación">
                <span className="material-symbols-outlined">menu</span>
            </button>
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold text-text-primary hidden sm:block">
                Panel de Administración
            </h1>
        </div>
        <div className="flex items-center">
            <span className="mr-3 font-medium text-text-primary hidden sm:inline">
                {adminUser?.name || 'Admin'}
            </span>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
        </div>
    </header>
);

const Sidebar = ({ currentView, setView, onSignOut, isOpen }) => {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard General', icon: <span className="material-symbols-outlined">dashboard</span> },
    { id: 'access_control', name: 'Control de Acceso', icon: <span className="material-symbols-outlined">security</span> },
    { id: 'clients', name: 'Clientes', icon: <span className="material-symbols-outlined">group</span> },
    { id: 'storage', name: 'Bodegas', icon: <span className="material-symbols-outlined">warehouse</span> },
    { id: 'invoices', name: 'Facturas', icon: <span className="material-symbols-outlined">receipt_long</span> },
    { id: 'managers', name: 'Administradores', icon: <span className="material-symbols-outlined">admin_panel_settings</span> },
  ];

  const profileNavItem = { id: 'profile', name: 'Mi Perfil', icon: <span className="material-symbols-outlined">account_circle</span> };

  return (
    <aside className={`fixed top-20 bottom-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 md:relative md:top-auto md:bottom-auto md:translate-x-0 md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.id ? 'bg-blue-50 text-primary' : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'}`}>
            {item.icon}
            <span className="ml-4">{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-border">
        <button onClick={() => setView(profileNavItem.id)} className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors mb-2 ${currentView === profileNavItem.id ? 'bg-blue-50 text-primary' : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'}`}>
            {profileNavItem.icon}
            <span className="ml-4">{profileNavItem.name}</span>
        </button>
        <button onClick={onSignOut} className="w-full flex items-center px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined">logout</span>
          <span className="ml-4">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};


const AdminPanel = (props) => {
    const { adminUser, onAdminLogout, companyProfiles, loginUsers, invoices, authorizedPersons, storageUnits, 
            onCreateClient, onCreateMultipleClients, onUpdateClient, accessLogs, onRegisterAccess, onAddAuthorizedPerson } = props;
    
    const [currentView, setCurrentView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 150);
        return () => clearTimeout(timer);
    }, []);
    
    const handleSetView = (view) => {
        setCurrentView(view);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <AdminDashboard 
                            companyProfiles={companyProfiles}
                            invoices={invoices}
                            storageUnits={storageUnits}
                        />;
            case 'access_control':
                return <AdminAccessControl 
                            accessLogs={accessLogs} 
                            authorizedPersons={authorizedPersons}
                            onRegisterAccess={onRegisterAccess}
                            onAddAuthorizedPerson={onAddAuthorizedPerson}
                        />;
            case 'clients':
                return <AdminClients />;
            case 'storage':
                return <AdminStorage />;
            case 'invoices':
                return <AdminInvoices />;
            case 'statements':
                return <AdminStatements invoices={invoices} companyProfiles={companyProfiles} />;
            case 'managers':
                return <AdminManagers />;
            case 'profile':
                return <AdminProfile adminUser={adminUser} />;
            default:
                return <div>Seleccione una vista</div>;
        }
    }

    return (
        <>
            {!isReady && (
                <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
                    <Spinner size="lg" />
                </div>
            )}
            
            <div 
                className="h-screen flex flex-col bg-background text-text-primary"
                style={{ visibility: isReady ? 'visible' : 'hidden' }}
            >
                <AdminHeader adminUser={adminUser} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="relative flex-1 md:flex">
                    {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"></div>}
                    
                    <Sidebar 
                        currentView={currentView} 
                        setView={handleSetView} 
                        onSignOut={onAdminLogout}
                        isOpen={isSidebarOpen}
                    />
                    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
                        {renderView()}
                    </main>
                </div>
            </div>
        </>
    );
};

export default AdminPanel;