// src/screens/AdminScreen.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin, AdminPanel } from '../../Components/index';
import { supabase } from '../../supabase';

const AdminScreen = () => {
  const navigate = useNavigate();

  // Estado interno: ¿el admin ya está logueado?
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados/datos que se cargan desde Supabase
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
        // Cargar datos del admin
        loadAdminData();
      } catch (err) {
        console.error('Error al restaurar sesión:', err);
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Cargar datos desde Supabase
  const loadAdminData = async () => {
    try {
      console.log('[AdminScreen] 🔄 Cargando datos del panel admin...');

      // 1. Cargar usuarios (clientes)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersError && users) {
        // Transformar a formato de company profiles
        const profiles = users.map(user => ({
          id: user.id,
          type: 'individual',
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at
        }));
        setCompanyProfiles(profiles);
        setLoginUsers(users);
        console.log('[AdminScreen] ✅ Usuarios cargados:', users.length);
      }

      // 2. Cargar bookings (facturas)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!bookingsError && bookings) {
        setAllInvoices(bookings);
        console.log('[AdminScreen] ✅ Bookings cargados:', bookings.length);
      }

      // 3. Cargar personas autorizadas (trabajadores/encargados)
      const { data: authorized, error: authorizedError } = await supabase
        .from('authorized_persons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!authorizedError && authorized) {
        setAllAuthorizedPersons(authorized);
        console.log('[AdminScreen] ✅ Personas autorizadas cargadas:', authorized.length);
      } else if (authorizedError) {
        console.log('[AdminScreen] ℹ️ Error cargando personas autorizadas:', authorizedError.message);
        // Si la tabla no existe, inicializar con array vacío
        setAllAuthorizedPersons([]);
      }

      // 4. Cargar inventario
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (!inventoryError && inventory) {
        setInventoryItems(inventory);
        console.log('[AdminScreen] ✅ Inventario cargado:', inventory.length);
      }

      // 5. Cargar logs de acceso (si existe la tabla)
      const { data: logs, error: logsError } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!logsError && logs) {
        setAccessLogs(logs);
        console.log('[AdminScreen] ✅ Logs de acceso cargados:', logs.length);
      } else if (logsError) {
        console.log('[AdminScreen] ℹ️ No se encontró tabla access_logs:', logsError.message);
      }

      console.log('[AdminScreen] ✅ Datos del panel admin cargados completamente');

    } catch (error) {
      console.error('[AdminScreen] ❌ Error cargando datos:', error);
    }
  };

  // ---------- HANDLERS ----------

  const handleAdminLogin = (credentials) => {
    // Validación de credenciales desde la API
    if (credentials && credentials.id) {
      console.log('Admin login exitoso:', credentials);
      setAdminUser(credentials);
      setIsAdminLoggedIn(true);
      // Guardar en localStorage
      localStorage.setItem('adminUser', JSON.stringify(credentials));
      // Cargar datos después del login
      loadAdminData();
    } else {
      console.error('Credenciales inválidas');
      alert('No se pudo completar el login');
    }
  };

  const handleRegisterAccess = async (personId, personName, documentId, action) => {
    try {
      console.log('[AdminScreen] 📝 Registrando acceso:', { personId, personName, documentId, action });
      
      const { data, error } = await supabase
        .from('access_logs')
        .insert([{
          person_id: personId,
          person_name: personName,
          document_id: documentId,
          action: action,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[AdminScreen] Error registrando acceso:', error);
        // Si la tabla no existe, agregar a los logs locales
        const newLog = {
          id: Date.now().toString(),
          person_id: personId,
          person_name: personName,
          document_id: documentId,
          action: action,
          created_at: new Date().toISOString()
        };
        setAccessLogs(prev => [newLog, ...prev]);
        alert('Acceso registrado localmente (sin sincronizar con BD)');
      } else {
        console.log('[AdminScreen] ✅ Acceso registrado:', data);
        setAccessLogs(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error('[AdminScreen] Error en handleRegisterAccess:', err);
    }
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

  const handleCreateClient = async (client) => {
    try {
      console.log('[AdminScreen] 👤 Creando cliente:', client);
      
      // Crear usuario en Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: client.name,
          email: client.email,
          phone: client.phone,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[AdminScreen] Error creando cliente:', error);
        alert('Error al crear el cliente: ' + error.message);
        return;
      }

      console.log('[AdminScreen] ✅ Cliente creado:', data);
      
      // Actualizar la lista local
      const profile = {
        id: data.id,
        type: 'individual',
        name: data.name,
        email: data.email,
        phone: data.phone,
        created_at: data.created_at
      };
      setCompanyProfiles(prev => [profile, ...prev]);
      setLoginUsers(prev => [data, ...prev]);
      
      alert('Cliente creado exitosamente');
    } catch (err) {
      console.error('[AdminScreen] Error en handleCreateClient:', err);
      alert('Error inesperado al crear el cliente');
    }
  };

  const handleCreateMultipleClients = async (clients) => {
    try {
      console.log('[AdminScreen] 👥 Creando múltiples clientes:', clients.length);
      
      const usersToInsert = clients.map(client => ({
        name: client.name,
        email: client.email,
        phone: client.phone,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('users')
        .insert(usersToInsert)
        .select();

      if (error) {
        console.error('[AdminScreen] Error creando clientes:', error);
        alert('Error al crear los clientes: ' + error.message);
        return;
      }

      console.log('[AdminScreen] ✅ Clientes creados:', data.length);
      
      // Actualizar la lista local
      const profiles = data.map(user => ({
        id: user.id,
        type: 'individual',
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at
      }));
      setCompanyProfiles(prev => [...profiles, ...prev]);
      setLoginUsers(prev => [...data, ...prev]);
      
      alert(`${data.length} clientes creados exitosamente`);
    } catch (err) {
      console.error('[AdminScreen] Error en handleCreateMultipleClients:', err);
      alert('Error inesperado al crear los clientes');
    }
  };

  const handleAdminUpdateProfile = async (profile) => {
    try {
      console.log('[AdminScreen] 🔄 Actualizando perfil:', profile);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          email: profile.email,
          phone: profile.phone
        })
        .eq('id', profile.id);

      if (error) {
        console.error('[AdminScreen] Error actualizando perfil:', error);
        alert('Error al actualizar el perfil: ' + error.message);
        return;
      }

      console.log('[AdminScreen] ✅ Perfil actualizado');
      
      // Actualizar la lista local
      setCompanyProfiles(prev => prev.map(p => 
        p.id === profile.id ? { ...p, ...profile } : p
      ));
      setLoginUsers(prev => prev.map(u => 
        u.id === profile.id ? { ...u, ...profile } : u
      ));
      
      alert('Perfil actualizado exitosamente');
    } catch (err) {
      console.error('[AdminScreen] Error en handleAdminUpdateProfile:', err);
      alert('Error inesperado al actualizar el perfil');
    }
  };

  const handleInventoryMovement = async (movement) => {
    try {
      console.log('[AdminScreen] 📦 Registrando movimiento de inventario:', movement);
      
      // Actualizar el inventario en Supabase
      const { data, error } = await supabase
        .from('inventory')
        .update({
          quantity: movement.newQuantity
        })
        .eq('id', movement.itemId)
        .select()
        .single();

      if (error) {
        console.error('[AdminScreen] Error actualizando inventario:', error);
        alert('Error al actualizar el inventario: ' + error.message);
        return;
      }

      console.log('[AdminScreen] ✅ Inventario actualizado:', data);
      
      // Actualizar la lista local
      setInventoryItems(prev => prev.map(item => 
        item.id === movement.itemId ? data : item
      ));
      
      // Agregar al log (si existe tabla de logs)
      const logEntry = {
        ...movement,
        timestamp: new Date().toISOString()
      };
      setInventoryLogs(prev => [logEntry, ...prev]);
      
    } catch (err) {
      console.error('[AdminScreen] Error en handleInventoryMovement:', err);
      alert('Error inesperado al registrar el movimiento');
    }
  };

  const addNotification = (notification) => {
    console.log('Notification:', notification);
  };

  const handleAddAuthorizedPerson = async (personData) => {
    try {
      console.log('[AdminScreen] 👤 Agregando persona autorizada:', personData);
      
      const { data, error } = await supabase
        .from('authorized_persons')
        .insert([{
          name: personData.name,
          document_type: personData.document_type || 'CC',
          document_id: personData.document_id,
          phone: personData.phone || null,
          email: personData.email || null,
          notes: personData.notes || null,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[AdminScreen] Error agregando persona autorizada:', error);
        throw new Error(error.message);
      }

      console.log('[AdminScreen] ✅ Persona autorizada agregada:', data);
      
      // Actualizar la lista local
      setAllAuthorizedPersons(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('[AdminScreen] Error en handleAddAuthorizedPerson:', err);
      throw err;
    }
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
        onAddAuthorizedPerson={handleAddAuthorizedPerson}
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
