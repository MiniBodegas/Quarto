import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { toProperCase } from '../utils/formatters';

const ManageUsers = ({ users, currentUser, onAddUser, onRemoveUser }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setIsSaving(true);
    await onAddUser(newName, newEmail);
    setIsSaving(false);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  const handleRemoveConfirm = async () => {
    if (!userToRemove) return;
    
    setIsSaving(true);
    await onRemoveUser(userToRemove.id);
    setIsSaving(false);
    setUserToRemove(null);
  };
  
  const getInitials = (name) => {
      const names = name.split(' ');
      if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestionar Usuarios del Portal</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>Agregar Nuevo Usuario</Button>
      </div>

      <Card>
        <div className="mb-4 bg-blue-50 border border-blue-200 text-primary rounded-md p-4 text-sm">
            <p>Aquí puede gestionar quién tiene acceso al portal de su empresa. Los nuevos usuarios deberán activar su cuenta la primera vez que ingresen.</p>
        </div>
        {users.length > 0 ? (
          <ul className="divide-y divide-border">
            {users.map((user) => {
                const isCurrentUser = currentUser.id === user.id;
                return (
                  <li key={user.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center">
                       <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-text-secondary mr-4">
                            {getInitials(user.name)}
                        </div>
                      <div>
                        <p className="font-medium text-text-primary">{user.name} {isCurrentUser && <span className="text-xs font-normal text-primary bg-blue-100 px-2 py-0.5 rounded-full ml-2">Usted</span>}</p>
                        <p className="text-sm text-text-secondary">Correo: {user.email}</p>
                      </div>
                    </div>
                    <Button 
                        variant="danger" 
                        onClick={() => setUserToRemove(user)}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? "No puede eliminarse a sí mismo" : "Eliminar usuario"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </Button>
                  </li>
                )
            })}
          </ul>
        ) : (
          <div className="text-center py-10 text-text-secondary">
            <p>No hay usuarios registrados para esta cuenta.</p>
          </div>
        )}
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Usuario del Portal">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            id="name"
            value={newName}
            onChange={(e) => setNewName(toProperCase(e.target.value))}
            required
            placeholder="Ej: Ana Gómez"
          />
          <Input
            label="Correo Electrónico de Acceso"
            id="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="Ej: ana.g@suempresa.com"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !newName.trim() || !newEmail.trim()}>
              {isSaving ? <Spinner size="sm" /> : 'Guardar Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove User Confirmation Modal */}
      <Modal isOpen={!!userToRemove} onClose={() => setUserToRemove(null)} title="Confirmar Eliminación">
        {userToRemove && (
          <div>
            <p className="text-text-secondary mb-4">
              ¿Estás seguro de que deseas revocar el acceso al portal para <span className="font-bold text-text-primary">{userToRemove.name}</span>?
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setUserToRemove(null)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleRemoveConfirm} disabled={isSaving}>
                {isSaving ? <Spinner size="sm" /> : 'Sí, Revocar Acceso'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageUsers;