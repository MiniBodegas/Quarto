import { useState } from "react";
import { Portal } from "../../Components/index";

const UserScreen = () => {
  const [loggedInCompanyProfile, setLoggedInCompanyProfile] = useState({ id: 1, type: 'company', name: 'Mi Empresa' });
  const [loginUser, setLoginUser] = useState({ id: 123, name: 'Juan Pérez' });
  const [loginUsers, setLoginUsers] = useState([
    { id: 123, name: 'Juan Pérez', company_id: 1 },
    { id: 124, name: 'Ana López', company_id: 1 },
  ]);

  const userInvoices = [];
  const authorizedPersons = [];
  const userInventory = [];
  const userInventoryLogs = [];
  const userStorageUnits = [];

  const handleSignOut = () => {};
  const handleUpdateInvoice = () => {};
  const handleUpdateMultipleInvoices = () => {};
  const handleUpdateProfile = () => {};
  const handleAddPerson = () => {};
  const handleRemovePerson = () => {};
  const handleAddUser = () => {};
  const handleRemoveUser = () => {};
  const handleInventoryMovement = () => {};
  const isRecentLogin = false;
  const addNotification = () => {};

  const companyUsers = loginUsers.filter(
    (u) => u.company_id === loggedInCompanyProfile.id
  );

  return (
    <Portal
      company={loggedInCompanyProfile}
      loginUser={loginUser}
      invoices={userInvoices}
      authorizedPersons={authorizedPersons}
      users={companyUsers}
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
};

export default UserScreen;