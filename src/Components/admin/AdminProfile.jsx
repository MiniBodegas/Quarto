import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import { toProperCase } from '../../utils/formatters';

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Datos simulados para el perfil de administrador
  const [userEmail] = useState('admin@quarto.com');
  const [profile, setProfile] = useState({
    nombres: 'Admin',
    apellidos: 'Quarto',
    celular: '3001234567',
    tipo_documento: 'CC',
    numero_documento: '1020304050',
    empresa: 'Quarto S.A.S.'
  });
  
  const [firstName, setFirstName] = useState(profile.nombres);
  const [lastName, setLastName] = useState(profile.apellidos);
  const [phone, setPhone] = useState(profile.celular);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEditToggle = () => {
    if (isEditing) {
      // Restablecer campos si se cancela
      setFirstName(profile.nombres);
      setLastName(profile.apellidos);
      setPhone(profile.celular);
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName || !phone) {
        setError('Nombres, apellidos y celular son obligatorios.');
        return;
    }
    if (/\d/.test(firstName) || /\d/.test(lastName)) {
        setError('Los nombres y apellidos no deben contener números.');
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        setError('El celular debe contener exactamente 10 dígitos y solo números.');
        return;
    }

    setIsSaving(true);
    // Simular un retraso de red
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedProfile = {
        ...profile,
        nombres: firstName.trim(),
        apellidos: lastName.trim(),
        celular: phone,
    };
    
    setProfile(updatedProfile);
    
    setIsSaving(false);
    setSuccess('¡Perfil actualizado con éxito!');
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Mi Perfil de Administrador</h1>
        {!isEditing && (
          <Button onClick={handleEditToggle}>Editar Perfil</Button>
        )}
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email_display" className="block text-sm font-medium text-text-secondary mb-1">Correo Electrónico (No editable)</label>
            <div id="email_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
              {userEmail}
            </div>
          </div>
          
          <Input 
            label="Nombres" 
            id="firstName" 
            value={firstName} 
            onChange={(e) => setFirstName(toProperCase(e.target.value))} 
            disabled={!isEditing}
            required
          />
          <Input 
            label="Apellidos" 
            id="lastName" 
            value={lastName} 
            onChange={(e) => setLastName(toProperCase(e.target.value))} 
            disabled={!isEditing} 
            required
          />
           <Input 
            label="Celular" 
            id="phone" 
            type="tel"
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            disabled={!isEditing} 
            required
          />
          <div>
            <label htmlFor="document_display" className="block text-sm font-medium text-text-secondary mb-1">Documento (No editable)</label>
            <div id="document_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
              {`${profile.tipo_documento} ${profile.numero_documento}`}
            </div>
          </div>
           <div>
            <label htmlFor="company_display" className="block text-sm font-medium text-text-secondary mb-1">Empresa (No editable)</label>
            <div id="company_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
              {profile.empresa}
            </div>
          </div>
          
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleEditToggle} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner size="sm"/> : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default AdminProfile;
