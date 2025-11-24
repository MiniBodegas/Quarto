import { useState } from 'react';
import {usePortalData } from './Hooks/usePortalData'
import {Auth,Portal,AdminPanel,AdminLogin,ToastContainer} from './Components/index' 


const App = () => {
  // Extraemos toda la lógica de negocio y estado a nuestro custom hook optimizado
  const {
    // Datos
    companyProfiles,
    loginUsers,
    allInvoices,
    allAuthorizedPersons,
    storageUnits,
    inventoryItems,
    inventoryLogs,
    accessLogs,
    notifications,
    
    // Estado de Sesión
    loggedInCompanyProfile,
    loginUser,
    isAdminLoggedIn,
    isRecentLogin,
    userInvoices,
    authorizedPersons,
    userInventory,
    userInventoryLogs,
    userStorageUnits,
    
    // Acciones
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
  } = usePortalData();

  // Estado local solo para UI (navegación simple entre Auth y Login de Admin)
  const [isAdminMode, setIsAdminMode] = useState(false);

  const renderContent = () => {
    // 1. Vista de Panel de Administrador
    if (isAdminMode) {
        if (isAdminLoggedIn) {
          return <AdminPanel 
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
                  />;
        }
        return <AdminLogin 
                  onLogin={handleAdminLogin} 
                  onGoToClientLogin={() => setIsAdminMode(false)} 
               />;
    }
    
    // 2. Vista de Portal de Cliente
    if (loggedInCompanyProfile && loginUser) {
      return (
        <Portal
          company={loggedInCompanyProfile}
          loginUser={loginUser}
          invoices={userInvoices}
          authorizedPersons={authorizedPersons}
          users={loginUsers.filter(u => u.company_id === loggedInCompanyProfile.id)}
          userInventory={userInventory}
          userInventoryLogs={userInventoryLogs}
          userStorageUnits={userStorageUnits}
          onSignOut={handleSignOut}
          onUpdateInvoice={handleUpdateInvoice}
          onUpdateMultipleInvoices={handleUpdateMultipleInvoices}
          onUpdateProfile={handleUpdateProfile}
          onAddPerson={handleAddPerson}
          onRemovePerson={handleRemovePerson}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          onInventoryMovement={handleInventoryMovement}
          isRecentLogin={isRecentLogin}
          addNotification={addNotification}
        />
      );
    }
    
    // 3. Vista de Selección de Rol (Auth Simplificado)
    return <Auth 
              onLogin={handleClientLogin} 
              onAdminClick={() => setIsAdminMode(true)} 
              companyProfiles={companyProfiles}
              loginUsers={loginUsers}
           />;
  };

  return (
    <>
      {renderContent()}
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
    </>
  );
};

export default App;