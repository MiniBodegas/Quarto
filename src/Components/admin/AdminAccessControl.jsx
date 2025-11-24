import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { toProperCase } from '../../utils/formatters';

const AdminAccessControl = ({ accessLogs, companyProfiles, authorizedPersons, onRegisterAccess }) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const availablePersons = useMemo(() => {
        if (!selectedCompanyId) return [];
        return authorizedPersons.filter(p => p.company_id === selectedCompanyId);
    }, [selectedCompanyId, authorizedPersons]);

    // Calculate who is currently on site
    const peopleOnSite = useMemo(() => {
        const statusMap = new Map(); // Map person_id to last log

        // Sort logs oldest to newest to replay history
        const sortedLogs = [...accessLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        sortedLogs.forEach(log => {
            if (log.action === 'entry') {
                statusMap.set(log.person_id, log);
            } else {
                statusMap.delete(log.person_id);
            }
        });

        return Array.from(statusMap.values()).map(log => {
            const companyName = companyProfiles.find(c => c.id === log.company_id)?.name || 'Desconocido';
            return { ...log, companyName };
        });
    }, [accessLogs, companyProfiles]);

    const handleAction = async (action, personOverride) => {
        const personId = personOverride ? personOverride.id : selectedPersonId;
        const companyId = personOverride ? personOverride.companyId : selectedCompanyId;
        
        if (!personId || !companyId) return;

        const person = authorizedPersons.find(p => p.id === personId);
        const personName = person ? person.name : (personOverride?.name || 'Desconocido');

        setIsProcessing(true);
        await onRegisterAccess(companyId, personId, personName, action);
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

    return (
        <div>
             <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Control de Acceso y Bitácora</h1>
                <p className="text-text-secondary mt-1">Registro de entradas y salidas de personal autorizado a las bodegas.</p>
            </div>

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
                                <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                                <select 
                                    className="w-full bg-white border border-border rounded-md px-3 py-2"
                                    value={selectedCompanyId}
                                    onChange={(e) => { setSelectedCompanyId(e.target.value); setSelectedPersonId(''); }}
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {companyProfiles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Persona Autorizada</label>
                                <select 
                                    className="w-full bg-white border border-border rounded-md px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    value={selectedPersonId}
                                    onChange={(e) => setSelectedPersonId(e.target.value)}
                                    disabled={!selectedCompanyId}
                                >
                                    <option value="">-- Seleccionar Persona --</option>
                                    {availablePersons.map(p => <option key={p.id} value={p.id}>{p.name} (Doc: {p.document_id})</option>)}
                                </select>
                            </div>

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
                                            <p className="text-xs text-text-secondary">{log.companyName}</p>
                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                Entrada: {formatDate(log.timestamp)}
                                            </p>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            className="text-xs px-2 py-1 h-auto"
                                            onClick={() => handleAction('exit', { id: log.person_id, name: log.person_name, companyId: log.company_id })}
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
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Cliente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[...accessLogs]
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map(log => {
                                            const companyName = companyProfiles.find(c => c.id === log.company_id)?.name || 'Desconocido';
                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                                                        {formatDate(log.timestamp)}
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
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary truncate max-w-[150px]" title={companyName}>
                                                        {companyName}
                                                    </td>
                                                </tr>
                                            );
                                    })}
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