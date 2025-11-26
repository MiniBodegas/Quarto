import {Portal} from '../../Components/index';

const UserScreen = ({
  loggedInCompanyProfile,
  loginUser,
  userInvoices,
  authorizedPersons,
  loginUsers,
  userInventory,
  userInventoryLogs,
  userStorageUnits,
  handleSignOut,
  handleUpdateInvoice,
  handleUpdateMultipleInvoices,
  handleUpdateProfile,
  handleAddPerson,
  handleRemovePerson,
  handleAddUser,
  handleRemoveUser,
  handleInventoryMovement,
  isRecentLogin,
  addNotification
}) => {
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
  return null;
};

export default UserScreen;