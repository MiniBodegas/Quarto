import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const AdminAccessControl = ({ accessLogs, authorizedPersons, onRegisterAccess, onAddAuthorizedPerson }) => {
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    
    // Estados para el formulario de nueva persona
    const [newPerson, setNewPerson] = useState({
        name: '',
        document_type: 'CC',
        document_id: '',
        phone: '',
        email: '',
        notes: ''
    });

    // Calculate who is currently on site
    const peopleOnSite = useMemo(() => {
        const statusMap = new Map(); // Map person_id to last log

        // Sort logs oldest to newest to replay history
        const sortedLogs = [...accessLogs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        sortedLogs.forEach(log => {
            if (log.action === 'entry') {
                statusMap.set(log.person_id, log);
            } else {
                statusMap.delete(log.person_id);
            }
        });

        return Array.from(statusMap.values());
    }, [accessLogs]);

    const handleAction = async (action, personOverride) => {
        const personId = personOverride ? personOverride.id : selectedPersonId;
        
        if (!personId) return;

        const person = authorizedPersons.find(p => p.id === personId);
        if (!person) {
            alert('Persona no encontrada');
            return;
        }

        setIsProcessing(true);
        await onRegisterAccess(personId, person.name, person.document_id, action);
        setIsProcessing(false);
        
        // Reset selection if it was a manual entry
        if (!personOverride) {
            setSelectedPersonId('');
        }
    };
    
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-CO', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }).format(date);
    };

    const handleAddPerson = async () => {
        if (!newPerson.name || !newPerson.document_id) {
            alert('Por favor completa al menos el nombre y documento de la persona');
            return;
        }

        setIsProcessing(true);
        try {
            await onAddAuthorizedPerson(newPerson);
            
            // Resetear formulario
            setNewPerson({
                name: '',
                document_type: 'CC',
                document_id: '',
                phone: '',
                email: '',
                notes: ''
            });
            setShowAddPersonModal(false);
            alert('Persona autorizada agregada exitosamente');
        } catch (error) {
            console.error('Error agregando persona:', error);
            alert('Error al agregar la persona autorizada: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
             <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Control de Acceso y Bitácora</h1>
                <p className="text-text-secondary mt-1">Registro de entradas y salidas de personal autorizado a las bodegas.</p>
            </div>

            {/* Modal para agregar persona autorizada */}
            {showAddPersonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-primary">Agregar Persona Autorizada</h3>
                            <button 
                                onClick={() => setShowAddPersonModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Tipo de Documento</label>
                                <select 
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.document_type}
                                    onChange={(e) => setNewPerson({...newPerson, document_type: e.target.value})}
                                >
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="PP">Pasaporte</option>
                                    <option value="NIT">NIT</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Nombre Completo *</label>
                                <input 
                                    type="text"
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.name}
                                    onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Documento de Identidad *</label>
                                <input 
                                    type="text"
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.document_id}
                                    onChange={(e) => setNewPerson({...newPerson, document_id: e.target.value})}
                                    placeholder="Ej: 1234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Teléfono</label>
                                <input 
                                    type="tel"
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.phone}
                                    onChange={(e) => setNewPerson({...newPerson, phone: e.target.value})}
                                    placeholder="Ej: 3001234567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                <input 
                                    type="email"
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.email}
                                    onChange={(e) => setNewPerson({...newPerson, email: e.target.value})}
                                    placeholder="Ej: juan@ejemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Notas</label>
                                <textarea 
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={newPerson.notes}
                                    onChange={(e) => setNewPerson({...newPerson, notes: e.target.value})}
                                    placeholder="Cargo, área, observaciones..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    variant="secondary"
                                    onClick={() => setShowAddPersonModal(false)}
                                    className="flex-1"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleAddPerson}
                                    className="flex-1"
                                    disabled={isProcessing || !newPerson.name || !newPerson.document_id}
                                >
                                    {isProcessing ? <Spinner size="sm" /> : 'Agregar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Registro */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center">
                            <span className="material-symbols-outlined mr-2">login</span>
                            Registrar Nuevo Acceso
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Persona Autorizada</label>
                                <select 
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={selectedPersonId}
                                    onChange={(e) => setSelectedPersonId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Persona --</option>
                                    {authorizedPersons.map(p => <option key={p.id} value={p.id}>{p.name} - {p.document_type}: {p.document_id}</option>)}
                                </select>
                                {authorizedPersons.length === 0 && (
                                    <p className="text-xs text-orange-600 mt-1">No hay personas autorizadas registradas</p>
                                )}
                            </div>

                            {/* Botón para agregar persona */}
                            <Button 
                                variant="secondary"
                                className="w-full justify-center py-2 text-sm"
                                onClick={() => setShowAddPersonModal(true)}
                            >
                                <span className="material-symbols-outlined text-base mr-2">person_add</span>
                                Agregar Persona Autorizada
                            </Button>

                            <Button 
                                className="w-full justify-center py-3 font-bold"
                                onClick={() => handleAction('entry')}
                                disabled={!selectedPersonId || isProcessing}
                            >
                                {isProcessing ? <Spinner size="sm" /> : 'Registrar Entrada'}
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-white border-l-4 border-green-500">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-text-primary">En Sitio Ahora</h2>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{peopleOnSite.length}</span>
                        </div>
                        
                        {peopleOnSite.length > 0 ? (
                            <ul className="space-y-3">
                                {peopleOnSite.map(log => (
                                    <li key={log.id} className="bg-gray-50 p-3 rounded-md border border-border flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-text-primary">{log.person_name}</p>
                                            <p className="text-xs text-text-secondary">Doc: {log.document_id}</p>
                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                Entrada: {formatDate(log.created_at)}
                                            </p>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            className="text-xs px-2 py-1 h-auto"
                                            onClick={() => handleAction('exit', { id: log.person_id })}
                                            disabled={isProcessing}
                                        >
                                            Marcar Salida
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary text-center py-4">No hay nadie registrado dentro de las instalaciones.</p>
                        )}
                    </Card>
                </div>

                {/* Historial */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <h2 className="text-lg font-bold text-text-primary mb-4">Historial Reciente de Accesos</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Acción</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Persona</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Documento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[...accessLogs]
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                                    {formatDate(log.created_at)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        log.action === 'entry' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {log.action === 'entry' ? 'Entrada' : 'Salida'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">
                                                    {log.person_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                                    {log.document_id}
                                                </td>
                                            </tr>
                                        ))}
                                    {accessLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-text-secondary">No hay registros en la bitácora.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminAccessControl;