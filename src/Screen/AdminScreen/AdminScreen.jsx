import AdminPanel from '../Components/AdminPanel';
import AdminLogin from '../Components/AdminLogin';

const AdminScreen = ({
  isAdminLoggedIn,
  companyProfiles,
  loginUsers,
  allInvoices,
  allAuthorizedPersons,
  storageUnits,
  inventoryItems,
  inventoryLogs,
  accessLogs,
  handleRegisterAccess,
  handleAdminLogout,
  handleCreateClient,
  handleCreateMultipleClients,
  handleAdminUpdateProfile,
  handleInventoryMovement,
  addNotification,
  handleAdminLogin,
  setIsAdminMode
}) => {
  if (isAdminLoggedIn) {
    return (
      <AdminPanel
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
  return (
    <AdminLogin
      onLogin={handleAdminLogin}
      onGoToClientLogin={() => setIsAdminMode(false)}
    />
  );
};

export default AdminScreen;