import { useState, useCallback } from 'react';
import {
  mockAuthorizedPersons,
  mockStorageUnits,
  allCompanyProfiles as mockCompanyProfiles,
  mockLoginUsers,
  mockInvoices,
  mockInventoryItems,
  mockInventoryLogs,
  mockAccessLogs
} from '../data/mockData';

export const usePortalData = () => {
  // --- Estado de Datos Globales (Simulando Base de Datos) ---
  const [companyProfiles, setCompanyProfiles] = useState(mockCompanyProfiles);
  const [loginUsers, setLoginUsers] = useState(mockLoginUsers);
  const [allInvoices, setAllInvoices] = useState(mockInvoices);
  const [allAuthorizedPersons, setAllAuthorizedPersons] = useState(mockAuthorizedPersons);
  const [storageUnits] = useState(mockStorageUnits);
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems);
  const [inventoryLogs, setInventoryLogs] = useState(mockInventoryLogs);
  const [accessLogs, setAccessLogs] = useState(mockAccessLogs);

  // --- Estado de Sesión ---
  const [loggedInCompanyProfile, setLoggedInCompanyProfile] = useState(null);
  const [loginUser, setLoginUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isRecentLogin, setIsRecentLogin] = useState(false);

  // --- Estado Derivado para el Usuario Logueado ---
  const [userInvoices, setUserInvoices] = useState([]);
  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [userInventoryLogs, setUserInventoryLogs] = useState([]);
  const [userStorageUnits, setUserStorageUnits] = useState([]);

  // --- Estado de Notificaciones ---
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Acciones de Autenticación ---

  const handleClientLogin = useCallback((company, user) => {
    const now = Date.now();
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    const thirtyMinutes = 30 * 60 * 1000;

    setIsRecentLogin(lastLoginTime ? (now - parseInt(lastLoginTime, 10)) < thirtyMinutes : false);
    localStorage.setItem('lastLoginTime', now.toString());
      
    setLoggedInCompanyProfile(company);
    setLoginUser(user);
    
    // Filtrar datos específicos para este cliente
    setUserInvoices(allInvoices.filter(invoice => invoice.company_id === company.id));
    setAuthorizedPersons(allAuthorizedPersons.filter(person => person.company_id === company.id));
    setUserInventory(inventoryItems.filter(item => item.company_id === company.id));
    setUserInventoryLogs(inventoryLogs.filter(log => log.company_id === company.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setUserStorageUnits(storageUnits.filter(unit => unit.company_id === company.id));

    setIsAdminLoggedIn(false);
    
    addNotification('success', `Bienvenido, ${user.name}`);
  }, [allInvoices, allAuthorizedPersons, inventoryItems, inventoryLogs, storageUnits, addNotification]);

  const handleSignOut = useCallback(() => {
    setLoggedInCompanyProfile(null);
    setLoginUser(null);
    setUserInvoices([]);
    setAuthorizedPersons([]);
    setUserInventory([]);
    setUserInventoryLogs([]);
    setUserStorageUnits([]);
    setIsAdminLoggedIn(false);
    addNotification('info', 'Sesión cerrada correctamente');
  }, [addNotification]);

  const handleAdminLogin = useCallback((email, password) => {
    if (email.toLowerCase() === 'admin@quarto.com') {
        setIsAdminLoggedIn(true);
        setLoggedInCompanyProfile(null);
        setLoginUser(null);
        addNotification('success', 'Bienvenido al Panel de Administración');
        return true;
    }
    addNotification('error', 'Credenciales inválidas');
    return false;
  }, [addNotification]);

  const handleAdminLogout = useCallback(() => {
      setIsAdminLoggedIn(false);
      addNotification('info', 'Sesión de administrador cerrada');
  }, [addNotification]);


  // --- Acciones de Datos (Simulando llamadas API) ---

  const handleUpdateInvoice = useCallback(async (invoiceToUpdate) => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    const updateLogic = (inv) => inv.id === invoiceToUpdate.id ? { ...inv, status: 'paid' } : inv;

    setUserInvoices(current => current.map(updateLogic));
    setAllInvoices(current => current.map(updateLogic));
  }, []);

  const handleUpdateMultipleInvoices = useCallback(async (invoiceIds) => {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    const updateLogic = (inv) => invoiceIds.includes(inv.id) ? { ...inv, status: 'paid' } : inv;

    setUserInvoices(current => current.map(updateLogic));
    setAllInvoices(current => current.map(updateLogic));
  }, []);
  
  const handleUpdateProfile = useCallback(async (updatedProfile) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoggedInCompanyProfile(updatedProfile);
    setCompanyProfiles(current => current.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    addNotification('success', 'Perfil actualizado correctamente');
  }, [addNotification]);
  
  const handleAdminUpdateProfile = useCallback(async (updatedProfile) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setCompanyProfiles(current => current.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    addNotification('success', 'Datos del cliente actualizados');
  }, [addNotification]);

  const handleAddPerson = useCallback(async (name, documentId) => {
    if (!loggedInCompanyProfile) return;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPerson = {
      id: `auth-${Date.now()}`,
      company_id: loggedInCompanyProfile.id,
      name,
      document_id: documentId,
      authorized_by: loggedInCompanyProfile.type === 'company' ? loginUser?.name : undefined,
    };

    setAuthorizedPersons(current => [...current, newPerson]);
    setAllAuthorizedPersons(current => [...current, newPerson]);
  }, [loggedInCompanyProfile, loginUser]);

  const handleRemovePerson = useCallback(async (personId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setAuthorizedPersons(current => current.filter(p => p.id !== personId));
    setAllAuthorizedPersons(current => current.filter(p => p.id !== personId));
  }, []);
  
  const handleAddUser = useCallback(async (name, email) => {
    if (!loggedInCompanyProfile) return;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = {
      id: `login-user-${Date.now()}`,
      company_id: loggedInCompanyProfile.id,
      name,
      email,
      has_password: false,
    };
    setLoginUsers(current => [...current, newUser]);
    addNotification('success', 'Nuevo usuario creado con éxito');
  }, [loggedInCompanyProfile, addNotification]);

  const handleRemoveUser = useCallback(async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoginUsers(current => current.filter(u => u.id !== userId));
    addNotification('success', 'Acceso revocado correctamente');
  }, [addNotification]);
  
  // Lógica de Admin para crear clientes
  const handleCreateClient = useCallback(async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newCompanyId = `company-${Date.now()}`;
    
    const newCompany = {
      id: newCompanyId,
      name: data.companyName,
      type: data.companyType,
      document_id: data.documentId,
      billing_email: data.billingEmail,
      operational_contact_email: data.userEmail,
      phone: data.phone,
      address: data.address,
      storage_unit_number: data.storageUnitNumber,
      account_credit: 0,
      has_automatic_payment: false,
    };

    const newUser = {
      id: `login-user-${Date.now()}`,
      company_id: newCompanyId,
      name: data.userName,
      email: data.userEmail,
      has_password: false,
    };

    setCompanyProfiles(current => [...current, newCompany]);
    setLoginUsers(current => [...current, newUser]);
    addNotification('success', `Cliente ${data.companyName} creado exitosamente`);
  }, [addNotification]);

  const handleCreateMultipleClients = useCallback(async (clientsData) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCompanies = [];
    const newUsers = [];

    clientsData.forEach(data => {
        const timestamp = Date.now() + Math.random();
        const newCompanyId = `company-${timestamp}`;
        
        newCompanies.push({
          id: newCompanyId,
          name: data.companyName,
          type: data.companyType,
          document_id: data.documentId,
          billing_email: data.billingEmail,
          operational_contact_email: data.userEmail,
          phone: data.phone,
          address: data.address,
          storage_unit_number: data.storageUnitNumber,
          account_credit: 0,
          has_automatic_payment: false,
        });

        newUsers.push({
          id: `login-user-${timestamp}`,
          company_id: newCompanyId,
          name: data.userName,
          email: data.userEmail,
          has_password: false,
        });
    });

    setCompanyProfiles(current => [...current, ...newCompanies]);
    setLoginUsers(current => [...current, ...newUsers]);
    addNotification('success', `${clientsData.length} clientes importados correctamente`);
  }, [addNotification]);

  // --- Lógica de Inventario ---
  const handleInventoryMovement = useCallback(async (
    companyId,
    storageUnitId,
    itemData,
    quantityChange,
    action,
    userName,
    notes
  ) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let currentItem = itemData.id 
        ? inventoryItems.find(i => i.id === itemData.id) 
        : null;

    let finalItemId = itemData.id || `item-${Date.now()}`;
    let previousQty = currentItem ? currentItem.quantity : 0;
    let newQty = previousQty;

    // 1. Handle Delete
    if (action === 'delete') {
        setInventoryItems(prev => prev.filter(item => item.id !== finalItemId));
        if (loggedInCompanyProfile?.id === companyId) {
            setUserInventory(prev => prev.filter(item => item.id !== finalItemId));
        }
        // Log deletion
        const newLog = {
            id: `log-${Date.now()}`,
            company_id: companyId,
            storage_unit_id: storageUnitId,
            item_id: finalItemId,
            item_name: currentItem ? currentItem.name : 'Item Eliminado',
            action: 'delete',
            quantity_change: -previousQty,
            previous_quantity: previousQty,
            new_quantity: 0,
            date: new Date().toISOString().split('T')[0],
            performed_by: userName,
            notes: notes || 'Artículo eliminado del inventario'
        };
        setInventoryLogs(prev => [newLog, ...prev]);
        if (loggedInCompanyProfile?.id === companyId) setUserInventoryLogs(prev => [newLog, ...prev]);
        addNotification('success', 'Artículo eliminado correctamente.');
        return;
    }

    // 2. Handle Update (Metadata only)
    if (action === 'update' && currentItem) {
         const updatedItem = { 
             ...currentItem, 
             ...itemData, 
             last_updated: new Date().toISOString().split('T')[0] 
         };
         
         setInventoryItems(prev => prev.map(item => item.id === finalItemId ? updatedItem : item));
         if (loggedInCompanyProfile?.id === companyId) {
            setUserInventory(prev => prev.map(item => item.id === finalItemId ? updatedItem : item));
         }
         addNotification('success', 'Artículo actualizado correctamente.');
         return; 
    }

    // 3. Handle Create or Quantity Changes
    if (action === 'create' || !currentItem) {
        newQty = quantityChange;
        const newItem = {
            id: finalItemId,
            company_id: companyId,
            storage_unit_id: storageUnitId,
            name: itemData.name,
            category: itemData.category,
            description: itemData.description,
            quantity: newQty,
            last_updated: new Date().toISOString().split('T')[0]
        };
        setInventoryItems(prev => [...prev, newItem]);
        if (loggedInCompanyProfile?.id === companyId) setUserInventory(prev => [...prev, newItem]);
    } else {
        // Update existing item quantity
        newQty = currentItem.quantity + quantityChange;
        if (newQty < 0) newQty = 0; // Prevent negative stock

        const updatedItem = { ...currentItem, quantity: newQty, last_updated: new Date().toISOString().split('T')[0] };
        setInventoryItems(prev => prev.map(item => item.id === finalItemId ? updatedItem : item));
        if (loggedInCompanyProfile?.id === companyId) {
             setUserInventory(prev => prev.map(item => item.id === finalItemId ? updatedItem : item));
        }
    }

    // Create Log
    const newLog = {
        id: `log-${Date.now()}`,
        company_id: companyId,
        storage_unit_id: storageUnitId,
        item_id: finalItemId,
        item_name: itemData.name || (currentItem ? currentItem.name : 'Desconocido'),
        action: quantityChange > 0 ? (action === 'create' ? 'create' : 'entry') : 'exit',
        quantity_change: quantityChange,
        previous_quantity: previousQty,
        new_quantity: newQty,
        date: new Date().toISOString().split('T')[0],
        performed_by: userName,
        notes: notes
    };

    setInventoryLogs(prev => [newLog, ...prev]);
    if (loggedInCompanyProfile?.id === companyId) {
        setUserInventoryLogs(prev => [newLog, ...prev]);
    }

    addNotification('success', 'Movimiento de inventario registrado.');

  }, [inventoryItems, loggedInCompanyProfile, addNotification]);

  // --- Access Control Actions ---
  const handleRegisterAccess = useCallback(async (companyId, personId, personName, action) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newLog = {
        id: `access-${Date.now()}`,
        company_id: companyId,
        person_id: personId,
        person_name: personName,
        action: action,
        timestamp: new Date().toISOString(),
    };
    setAccessLogs(prev => [newLog, ...prev]);
    addNotification('success', `Se ha registrado la ${action === 'entry' ? 'entrada' : 'salida'} de ${personName}.`);
  }, [addNotification]);

  return {
    // State
    companyProfiles,
    loginUsers,
    allInvoices,
    allAuthorizedPersons,
    storageUnits,
    inventoryItems,
    inventoryLogs,
    accessLogs,
    loggedInCompanyProfile,
    loginUser,
    isAdminLoggedIn,
    isRecentLogin,
    userInvoices,
    authorizedPersons,
    userInventory,
    userInventoryLogs,
    userStorageUnits,
    notifications,
    
    // Actions
    handleClientLogin,
    handleSignOut,
    handleAdminLogin,
    handleAdminLogout,
    handleUpdateInvoice,
    handleUpdateMultipleInvoices,
    handleUpdateProfile,
    handleAdminUpdateProfile,
    handleAddPerson,
    handleRemovePerson,
    handleAddUser,
    handleRemoveUser,
    handleCreateClient,
    handleCreateMultipleClients,
    handleInventoryMovement,
    handleRegisterAccess,
    addNotification,
    removeNotification
  };
};