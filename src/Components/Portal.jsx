import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import InvoicesList from './Invoices';
import AuthorizedPersons from './AuthorizedPersons';
import ContactInfo from './ContactInfo';
import ManageUsers from './ManageUsers';
import Inventory from './Inventory';
import { QUARTO_LOGO_BASE64 } from '../utils/constants';
import Spinner from './ui/Spinner';

const Header = ({ onToggleSidebar, userName }) => (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between p-4 h-20 border-b border-border">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-100 md:hidden" aria-label="Abrir menú de navegación">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <img src={QUARTO_LOGO_BASE64} alt="Quarto Logo" className="h-12 w-auto" />
        </div>
        <div className="flex items-center">
            <span className="mr-3 font-medium text-text-primary hidden sm:inline">{userName.split(' ')[0]}</span>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                {userName.charAt(0)}
            </div>
        </div>
    </header>
);

const Sidebar = ({ currentView, setView, onSignOut, isOpen, companyType }) => {
  const navItems = [
    { id: 'dashboard', name: 'Panel de Control', icon: <span className="material-symbols-outlined">grid_view</span> },
    { id: 'inventory', name: 'Mi Inventario', icon: <span className="material-symbols-outlined">inventory_2</span> },
    { id: 'invoices', name: 'Facturas', icon: <span className="material-symbols-outlined">receipt_long</span> },
    { id: 'authorized', name: 'Personas Autorizadas', icon: <span className="material-symbols-outlined">list_alt_check</span> },
    { id: 'users', name: 'Gestionar Usuarios', icon: <span className="material-symbols-outlined">group</span>, companyOnly: true },
    { id: 'contact', name: 'Datos de Contacto', icon: <span className="material-symbols-outlined">person</span> },
  ];

  return (
    <aside className={`fixed top-20 bottom-0 left-0 z-40 w-64 bg-card border-r border-border flex-col transform transition-transform duration-300 md:relative md:top-auto md:bottom-auto md:translate-x-0 md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map(item => {
          if (item.companyOnly && companyType !== 'company') {
            return null;
          }
          return (
          <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.id ? 'bg-blue-50 text-primary' : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'}`}>
            {item.icon}
            <span className="ml-4">{item.name}</span>
          </button>
          )
        })}
      </nav>
      <div className="px-4 py-6 border-t border-border">
        <button onClick={onSignOut} className="w-full flex items-center px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined">logout</span>
          <span className="ml-4">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};


const Portal = ({ 
  company,
  loginUser,
  invoices, 
  authorizedPersons,
  users,
  userInventory = [],
  userInventoryLogs = [],
  userStorageUnits = [],
  onSignOut, 
  onUpdateInvoice, 
  onUpdateMultipleInvoices,
  onUpdateProfile, 
  onAddPerson, 
  onRemovePerson,
  onAddUser,
  onRemoveUser,
  onInventoryMovement,
  isRecentLogin,
  addNotification,
}) => {
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
        return <Dashboard company={company} loginUserName={loginUser.name} invoices={invoices} setView={handleSetView} isRecentLogin={isRecentLogin} />;
      case 'inventory':
        return <Inventory 
                  items={userInventory} 
                  logs={userInventoryLogs} 
                  storageUnits={userStorageUnits}
                  onMovement={(unitId, itemData, qty, action, notes) => 
                    onInventoryMovement(company.id, unitId, itemData, qty, action, loginUser.name, notes)
                  }
                />;
      case 'invoices':
        return <InvoicesList invoices={invoices} onUpdateInvoice={onUpdateInvoice} onUpdateMultipleInvoices={onUpdateMultipleInvoices} addNotification={addNotification} />;
      case 'authorized':
        return <AuthorizedPersons persons={authorizedPersons} onAddPerson={onAddPerson} onRemovePerson={onRemovePerson} companyType={company.type} addNotification={addNotification} />;
      case 'contact':
        return <ContactInfo company={company} onUpdateProfile={onUpdateProfile} />;
      case 'users':
        return <ManageUsers users={users} currentUser={loginUser} onAddUser={onAddUser} onRemoveUser={onRemoveUser} />;
      default:
        return <Dashboard company={company} loginUserName={loginUser.name} invoices={invoices} setView={handleSetView} isRecentLogin={isRecentLogin} />;
    }
  };

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
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} userName={loginUser.name} />

        <div className="relative flex-1 md:flex">
          {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"></div>}

          <Sidebar 
            currentView={currentView} 
            setView={handleSetView} 
            onSignOut={onSignOut} 
            isOpen={isSidebarOpen} 
            companyType={company.type}
          />
          
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
};

export default Portal;