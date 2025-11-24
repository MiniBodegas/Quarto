import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { toProperCase } from '../utils/formatters';

const AuthorizedPersons = ({ persons, onAddPerson, onRemovePerson, companyType, addNotification }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personToRemove, setPersonToRemove] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDocumentId, setNewDocumentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newDocumentId.trim()) return;

    setIsSaving(true);
    try {
        await onAddPerson(newName, newDocumentId);
        addNotification('success', `${newName} ha sido agregado a la lista de autorizados.`);
    } catch (error) {
        addNotification('error', 'Error al agregar la persona autorizada.');
    }
    setIsSaving(false);
    setIsAddModalOpen(false);
    setNewName('');
    setNewDocumentId('');
  };

  const handleRemoveConfirm = async () => {
    if (!personToRemove) return;
    
    setIsSaving(true);
    try {
        await onRemovePerson(personToRemove.id);
        addNotification('info', `${personToRemove.name} ha sido eliminado de la lista.`);
    } catch (error) {
        addNotification('error', 'Error al eliminar la persona autorizada.');
    }
    setIsSaving(false);
    setPersonToRemove(null);
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
        <h1 className="text-3xl font-bold text-text-primary">Personas Autorizadas</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>Agregar Nueva Persona</Button>
      </div>

      <Card>
        {persons.length > 0 ? (
          <ul className="divide-y divide-border">
            {persons.map((person) => (
              <li key={person.id} className="flex items-center justify-between py-4">
                <div className="flex items-center">
                   <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-text-secondary mr-4">
                        {getInitials(person.name)}
                    </div>
                  <div>
                    <p className="font-medium text-text-primary">{person.name}</p>
                    <p className="text-sm text-text-secondary">Documento: {person.document_id}</p>
                    {companyType === 'company' && person.authorized_by && (
                        <p className="text-xs text-text-secondary italic mt-1">
                          Autorizado por: {person.authorized_by}
                        </p>
                    )}
                  </div>
                </div>
                <Button variant="danger" onClick={() => setPersonToRemove(person)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-text-secondary">
            <p>No tienes ninguna persona autorizada registrada.</p>
            <p className="text-sm mt-1">Usa el botón "Agregar" para inscribir a alguien.</p>
          </div>
        )}
      </Card>

      {/* Add Person Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Persona Autorizada">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            id="name"
            value={newName}
            onChange={(e) => setNewName(toProperCase(e.target.value))}
            required
            placeholder="Ej: Juan Pérez"
          />
          <Input
            label="Número de Documento"
            id="documentId"
            value={newDocumentId}
            onChange={(e) => setNewDocumentId(e.target.value)}
            required
            placeholder="Ej: 1234567890"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !newName.trim() || !newDocumentId.trim()}>
              {isSaving ? <Spinner size="sm" /> : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Person Confirmation Modal */}
      <Modal isOpen={!!personToRemove} onClose={() => setPersonToRemove(null)} title="Confirmar Eliminación">
        {personToRemove && (
          <div>
            <p className="text-text-secondary mb-4">
              ¿Estás seguro de que deseas eliminar a <span className="font-bold text-text-primary">{personToRemove.name}</span> de tu lista de personas autorizadas?
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setPersonToRemove(null)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleRemoveConfirm} disabled={isSaving}>
                {isSaving ? <Spinner size="sm" /> : 'Eliminar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuthorizedPersons;
