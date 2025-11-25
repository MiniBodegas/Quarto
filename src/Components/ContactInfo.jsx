import { useState, useEffect } from 'react';
import {Card, Button, Input, Spinner} from './index';

const ContactInfo = ({ company, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(company);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(company);
  }, [company]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(company); // Restablecer cambios
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateProfile(formData);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary">Datos de la Cuenta</h1>
            {!isEditing && (
                 <Button type="button" onClick={() => setIsEditing(true)}>
                    Editar Datos
                 </Button>
            )}
        </div>
        <Card>
            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name_display" className="block text-sm font-medium text-text-secondary mb-1">Nombre o Razón Social</label>
                            <div id="name_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
                                {formData.name}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="billing_email_display" className="block text-sm font-medium text-text-secondary mb-1">Correo de Facturación (Representante Legal)</label>
                            <div id="billing_email_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
                                {formData.billing_email}
                            </div>
                        </div>
                        <Input id="operational_contact_email" type="email" label="Correo del Encargado de Bodega" value={formData.operational_contact_email} onChange={handleInputChange} required />
                        <Input id="phone" type="tel" label="Teléfono" value={formData.phone} onChange={handleInputChange} required />
                        <Input id="address" type="text" label="Dirección" value={formData.address} onChange={handleInputChange} required />
                        
                        <div>
                            <label htmlFor="document_id_display" className="block text-sm font-medium text-text-secondary mb-1">Documento (Cédula/NIT)</label>
                            <div id="document_id_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
                                {formData.document_id}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="storage_unit_number_display" className="block text-sm font-medium text-text-secondary mb-1">Número de Bodega</label>
                            <div id="storage_unit_number_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
                                {formData.storage_unit_number}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving || !formData.operational_contact_email || !formData.phone || !formData.address}>
                            {isSaving ? <Spinner size="sm" /> : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Nombre o Razón Social</p>
                        <p className="mt-1 text-text-primary text-lg">{company.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Documento (Cédula/NIT)</p>
                        <p className="mt-1 text-text-primary text-lg">{company.document_id}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-text-secondary">Correo de Facturación (Representante Legal)</p>
                        <p className="mt-1 text-text-primary text-lg">{company.billing_email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Correo del Encargado de Bodega</p>
                        <p className="mt-1 text-text-primary text-lg">{company.operational_contact_email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Teléfono</p>
                        <p className="mt-1 text-text-primary text-lg">{company.phone}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-text-secondary">Dirección</p>
                        <p className="mt-1 text-text-primary text-lg">{company.address}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Número de Bodega</p>
                        <p className="mt-1 text-text-primary text-lg">{company.storage_unit_number}</p>
                    </div>
                </div>
            )}
        </Card>
    </div>
  )
};

export default ContactInfo;