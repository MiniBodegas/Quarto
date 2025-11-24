import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import { toProperCase } from '../../utils/formatters';

// A simple, clean component for displaying read-only data.
const ReadOnlyField = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="mt-1 text-text-primary text-lg">{value}</p>
    </div>
);

const AdminClientDetail = ({ client, users, onUpdateClient, onBack }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(client);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(client);
  }, [client]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const formattedValue = id === 'name' ? toProperCase(value) : value;
    setFormData(prev => ({ ...prev, [id]: formattedValue }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(client);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateClient(formData);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <Button variant="secondary" onClick={onBack} className="mb-2">
                <span className="material-symbols-outlined mr-2 !text-base">arrow_back</span>
                Volver a Clientes
            </Button>
            <h1 className="text-3xl font-bold text-text-primary">{client.name}</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border mb-6">
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('info')}
          >
              Info General
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('users')}
          >
              Usuarios del Portal
          </button>
      </div>

      {/* Tab Content: INFO */}
      {activeTab === 'info' && (
        <Card>
            <div className="flex justify-end mb-4">
                 {!isEditing && (
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                        <span className="material-symbols-outlined mr-2 !text-base">edit</span>
                        Editar Cliente
                    </Button>
                )}
            </div>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {isEditing ? (
                        <>
                            <Input id="name" label="Nombre o Razón Social" value={formData.name} onChange={handleInputChange} required />
                            <Input id="document_id" label="Documento (Cédula/NIT)" value={formData.document_id} onChange={handleInputChange} required />
                            <Input id="billing_email" label="Correo de Facturación (Legal)" type="email" value={formData.billing_email} onChange={handleInputChange} required />
                            <Input id="operational_contact_email" label="Correo del Encargado de Bodega" type="email" value={formData.operational_contact_email} onChange={handleInputChange} required />
                            <Input id="phone" label="Teléfono" type="tel" value={formData.phone} onChange={handleInputChange} required />
                            <Input id="address" label="Dirección" value={formData.address} onChange={handleInputChange} required />
                            <Input id="storage_unit_number" label="Número de Bodega" value={formData.storage_unit_number} onChange={handleInputChange} required />
                            <div>
                            <p className="block text-sm font-medium text-text-secondary mb-1">Saldo a Favor (No editable)</p>
                                <div className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(formData.account_credit)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <ReadOnlyField label="Nombre o Razón Social" value={client.name} />
                            <ReadOnlyField label="Documento (Cédula/NIT)" value={client.document_id} />
                            <ReadOnlyField label="Correo de Facturación (Legal)" value={client.billing_email} />
                            <ReadOnlyField label="Correo del Encargado de Bodega" value={client.operational_contact_email} />
                            <ReadOnlyField label="Teléfono" value={client.phone} />
                            <ReadOnlyField label="Dirección" value={client.address} />
                            <ReadOnlyField label="Número de Bodega" value={client.storage_unit_number} />
                            <ReadOnlyField label="Saldo a Favor" value={new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(client.account_credit)} />
                        </>
                    )}
                </div>
                {isEditing && (
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Spinner size="sm" /> : 'Guardar Cambios'}
                        </Button>
                    </div>
                )}
            </form>
        </Card>
      )}

      {/* Tab Content: USERS */}
      {activeTab === 'users' && (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Usuarios con Acceso al Portal</h3>
            {users.length > 0 ? (
                <ul className="divide-y divide-border">
                    {users.map(user => (
                        <li key={user.id} className="py-3 flex items-center justify-between">
                             <div>
                                <p className="font-medium text-text-primary">{user.name}</p>
                                <p className="text-sm text-text-secondary">{user.email}</p>
                             </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-text-secondary">Este cliente no tiene usuarios de portal.</p>
            )}
        </Card>
      )}
    </div>
  );
};

export default AdminClientDetail;