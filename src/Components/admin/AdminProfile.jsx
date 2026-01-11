import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import { toProperCase } from '../../utils/formatters';

const AdminProfile = ({ adminUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Datos del admin logueado
  const [userEmail] = useState(adminUser?.email || 'admin@quarto.com');
  const [profile, setProfile] = useState({
    nombres: adminUser?.name || 'Admin',
  });
  
  const [firstName, setFirstName] = useState(profile.nombres);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEditToggle = () => {
    if (isEditing) {
      // Restablecer campos si se cancela
      setFirstName(profile.nombres);
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName) {
        setError('El nombre es obligatorio.');
        return;
    }

    setIsSaving(true);
    // Simular un retraso de red
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedProfile = {
        ...profile,
        nombres: firstName.trim(),
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
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email_display" className="block text-sm font-medium text-text-secondary mb-1">Correo Electrónico (No editable)</label>
            <div id="email_display" className="w-full bg-gray-100 border border-border rounded-md px-3 py-2 text-text-secondary cursor-not-allowed">
              {userEmail}
            </div>
          </div>
          
          <Input 
            label="Nombre" 
            id="firstName" 
            value={firstName} 
            onChange={(e) => setFirstName(toProperCase(e.target.value))} 
            disabled={!isEditing}
            required
          />
          
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
