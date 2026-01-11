// src/screens/AdminScreen.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin, AdminPanel } from '../../Components/index';

const AdminScreen = () => {
  const navigate = useNavigate();

  // Estado interno: ¿el admin ya está logueado?
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados/datos de ejemplo. En tu proyecto real puedes
  // reemplazar estos con datos que vengan de APIs, context, etc.
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [loginUsers, setLoginUsers] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allAuthorizedPersons, setAllAuthorizedPersons] = useState([]);
  const [storageUnits, setStorageUnits] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);

  // Verificar sesión guardada al cargar
  useEffect(() => {
    const savedAdminUser = localStorage.getItem('adminUser');
    if (savedAdminUser) {
      try {
        const user = JSON.parse(savedAdminUser);
        setAdminUser(user);
        setIsAdminLoggedIn(true);
      } catch (err) {
        console.error('Error al restaurar sesión:', err);
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  // ---------- HANDLERS ----------

  const handleAdminLogin = (credentials) => {
    // Validación de credenciales desde la API
    if (credentials && credentials.id) {
      console.log('Admin login exitoso:', credentials);
      setAdminUser(credentials);
      setIsAdminLoggedIn(true);
      // Guardar en localStorage
      localStorage.setItem('adminUser', JSON.stringify(credentials));
    } else {
      console.error('Credenciales inválidas');
      alert('No se pudo completar el login');
    }
  };

  const handleRegisterAccess = (data) => {
    console.log('Register access', data);
    // Aquí podrías actualizar accessLogs, etc.
  };

  const handleAdminLogout = () => {
    console.log('Admin logout');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    // Limpiar localStorage
    localStorage.removeItem('adminUser');
    // Si quieres que vuelva al login de cliente:
    // navigate('/user');
  };

  const handleCreateClient = (client) => {
    console.log('Create client', client);
    // setCompanyProfiles(prev => [...prev, client]);
  };

  const handleCreateMultipleClients = (clients) => {
    console.log('Create multiple clients', clients);
  };

  const handleAdminUpdateProfile = (profile) => {
    console.log('Update client profile', profile);
  };

  const handleInventoryMovement = (movement) => {
    console.log('Inventory movement', movement);
    // setInventoryLogs(prev => [...prev, movement]);
  };

  const addNotification = (notification) => {
    console.log('Notification:', notification);
  };

  const handleGoToClientLogin = () => {
    // Aquí decides a dónde va el "login de cliente"
    navigate('/user'); // o '/', según tu app
  };

  // ---------- RENDER ----------

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (isAdminLoggedIn) {
    return (
      <AdminPanel
        adminUser={adminUser}
        companyProfiles={companyProfiles}
        loginUsers={loginUsers}
        invoices={allInvoices}
        authorizedPersons={allAuthorizedPersons}
        storageUnits={storageUnits}
        inventoryItems={inventoryItems}
        inventoryLogs={inventoryLogs}
        accessLogs={accessLogs}
        onRegisterAccess={handleRegisterAccess}
        onAdminLogout={handleAdminLogout}
        onCreateClient={handleCreateClient}
        onCreateMultipleClients={handleCreateMultipleClients}
        onUpdateClient={handleAdminUpdateProfile}
        onInventoryMovement={handleInventoryMovement}
        addNotification={addNotification}
      />
    );
  }

  // Si NO está logueado, mostramos el login de admin
  return (
    <AdminLogin
      onLogin={handleAdminLogin}
      onGoToClientLogin={handleGoToClientLogin}
    />
  );
};

export default AdminScreen;
