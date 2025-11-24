import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import AdminClientDetail from './AdminClientDetail';
import { toProperCase } from '../../utils/formatters';

// --- Sub-component for Creating a Single Client ---
const CreateClientModal = ({ isOpen, onClose, onCreateClient }) => {
    const [isSaving, setIsSaving] = useState(false);
    const initialFormData = {
        companyName: '', companyType: 'individual', documentId: '',
        billingEmail: '', phone: '', address: '', storageUnitNumber: '',
        userName: '', userEmail: '',
    };
    const [formData, setFormData] = useState(initialFormData);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        let formattedValue = value;
        if (id === 'companyName' || id === 'userName') {
            formattedValue = toProperCase(value);
        }
        setFormData(prev => ({ ...prev, [id]: formattedValue }));
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onCreateClient(formData);
        setIsSaving(false);
        setFormData(initialFormData);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Cliente y Usuario">
            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-text-primary">Datos del Cliente</h3>
                <div>
                    <label htmlFor="companyType" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Cliente</label>
                    <select id="companyType" value={formData.companyType} onChange={handleInputChange} className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="individual">Persona Natural</option>
                        <option value="company">Empresa</option>
                    </select>
                </div>
                <Input id="companyName" label="Nombre o Razón Social" value={formData.companyName} onChange={handleInputChange} required />
                <Input id="documentId" label="Documento (Cédula/NIT)" value={formData.documentId} onChange={handleInputChange} required />
                <Input id="billingEmail" type="email" label="Correo de Facturación (Legal)" value={formData.billingEmail} onChange={handleInputChange} required />
                <Input id="phone" type="tel" label="Teléfono" value={formData.phone} onChange={handleInputChange} required />
                <Input id="address" label="Dirección" value={formData.address} onChange={handleInputChange} required />
                <Input id="storageUnitNumber" label="Número de Bodega" value={formData.storageUnitNumber} onChange={handleInputChange} required />
                <h3 className="text-lg font-semibold border-b pb-2 pt-4 mb-4 text-text-primary">Datos del Primer Usuario (Para Acceso al Portal)</h3>
                <p className="text-sm text-text-secondary -mt-2">Este usuario recibirá acceso para gestionar el portal en nombre del cliente.</p>
                <Input id="userName" label="Nombre del Usuario" value={formData.userName} onChange={handleInputChange} required />
                <Input id="userEmail" type="email" label="Correo Electrónico del Usuario" value={formData.userEmail} onChange={handleInputChange} required />
                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Spinner size="sm"/> : "Guardar Cliente"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Sub-component for Importing Multiple Clients ---
const ImportClientsModal = ({ isOpen, onClose, onCreateMultipleClients }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [importText, setImportText] = useState('');
    const [previewRows, setPreviewRows] = useState([]);

    const handleProcessImport = () => {
        const lines = importText.trim().split('\n');
        const processedRows = lines.map(line => {
            const columns = line.split('\t');
            if (columns.length !== 9) {
                return { data: {}, status: 'error', error: `Se esperaban 9 columnas, pero se encontraron ${columns.length}.`, originalLine: line };
            }

            const [companyNameRaw, companyTypeRaw, documentId, billingEmail, phone, address, storageUnitNumber, userNameRaw, userEmail] = columns.map(c => c.trim());
            const companyName = toProperCase(companyNameRaw);
            const userName = toProperCase(userNameRaw);
            const companyType = companyTypeRaw.toLowerCase() === 'empresa' ? 'company' : 'individual';
            const data = { companyName, companyType, documentId, billingEmail, phone, address, storageUnitNumber, userName, userEmail };
            
            if (!companyName || !documentId || !billingEmail || !userName || !userEmail) {
                 return { data, status: 'error', error: 'Faltan campos obligatorios (Nombre, Documento, Email Facturación, Nombre Usuario, Email Usuario).', originalLine: line };
            }

            return { data, status: 'valid', originalLine: line };
        });
        setPreviewRows(processedRows);
    }
    
    const handleConfirmImport = async () => {
        const validClients = previewRows.filter(row => row.status === 'valid').map(row => row.data);
        if (validClients.length === 0) return;

        setIsSaving(true);
        await onCreateMultipleClients(validClients);
        setIsSaving(false);
        setImportText('');
        setPreviewRows([]);
        onClose();
    }

    const resetAndClose = () => {
        setImportText('');
        setPreviewRows([]);
        onClose();
    }
    
    const validRowCount = useMemo(() => previewRows.filter(r => r.status === 'valid').length, [previewRows]);
    const errorRowCount = useMemo(() => previewRows.filter(r => r.status === 'error').length, [previewRows]);

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose} title="Importar Múltiples Clientes">
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-text-secondary">Copie y pegue los datos desde su hoja de cálculo. Asegúrese de que las columnas estén en el orden correcto y separadas por tabulación.</p>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-text-secondary overflow-x-auto">
                        <code>Nombre Cliente	Tipo	Documento	Email Facturación	Teléfono	Dirección	Bodega	Nombre Usuario	Email Usuario</code>
                    </div>
                     <p className="text-xs text-text-secondary mt-1">El tipo de cliente debe ser "Empresa" o "Persona Natural".</p>
                </div>
                <textarea 
                    id="import-data"
                    rows={8}
                    className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Pegue aquí los datos de los clientes, un cliente por línea..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                />
                <Button onClick={handleProcessImport} disabled={!importText.trim()} className="w-full">Procesar y Previsualizar</Button>
                
                {previewRows.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-text-primary">Previsualización de la Importación</h3>
                        <div className="flex gap-4 text-sm mt-2">
                            <p><span className="font-bold text-green-600">{validRowCount}</span> clientes listos para importar.</p>
                            <p><span className="font-bold text-red-600">{errorRowCount}</span> filas con errores.</p>
                        </div>
                        <div className="max-h-48 overflow-y-auto mt-2 space-y-2 pr-2">
                            {previewRows.map((row, index) => (
                                <div key={index} className={`p-2 rounded text-xs border ${row.status === 'valid' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="font-mono truncate" title={row.originalLine}>{row.originalLine}</p>
                                    {row.status === 'error' && <p className="font-semibold text-red-700 mt-1">Error: {row.error}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="secondary" onClick={resetAndClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleConfirmImport} disabled={isSaving || validRowCount === 0}>
                        {isSaving ? <Spinner size="sm"/> : `Confirmar Importación (${validRowCount})`}
                    </Button>
                </div>
            </div>
         </Modal>
    );
};

// --- Main AdminClients Component ---
const AdminClients = ({ 
    companyProfiles, loginUsers, onCreateClient, onCreateMultipleClients, onUpdateClient
}) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredClients = useMemo(() => {
        if (!searchTerm) return companyProfiles;
        return companyProfiles.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.document_id.includes(searchTerm)
        );
    }, [companyProfiles, searchTerm]);

    const usersForSelectedClient = useMemo(() => {
        if (!selectedClient) return [];
        return loginUsers.filter(user => user.company_id === selectedClient.id);
    }, [selectedClient, loginUsers]);

    if (selectedClient) {
        return <AdminClientDetail 
                    client={selectedClient} 
                    users={usersForSelectedClient}
                    onUpdateClient={onUpdateClient} 
                    onBack={() => setSelectedClient(null)} 
                />
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Clientes</h1>
                    <p className="text-text-secondary mt-1">Gestiona los perfiles de clientes y sus usuarios de acceso.</p>
                </div>
                <div className="flex gap-3 mt-4 sm:mt-0">
                    <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>Importar Múltiples Clientes</Button>
                    <Button onClick={() => setIsIndividualModalOpen(true)}>Agregar Cliente Individual</Button>
                </div>
            </div>
            
            <Card>
                <div className="mb-4">
                     <Input 
                        label="Buscar Cliente"
                        id="search-client"
                        placeholder="Buscar por nombre o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {filteredClients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nombre / Razón Social</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Bodega</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Contacto Principal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {filteredClients.map(profile => (
                                    <tr key={profile.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{profile.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{profile.document_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{profile.storage_unit_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{profile.operational_contact_email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${profile.type === 'company' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {profile.type === 'company' ? 'Empresa' : 'Persona'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button variant="secondary" onClick={() => setSelectedClient(profile)}>
                                                Ver / Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-text-secondary py-8">No se encontraron clientes.</p>
                )}
            </Card>

            <CreateClientModal 
                isOpen={isIndividualModalOpen}
                onClose={() => setIsIndividualModalOpen(false)}
                onCreateClient={onCreateClient}
            />
            
            <ImportClientsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onCreateMultipleClients={onCreateMultipleClients}
            />
        </div>
    );
};

export default AdminClients;