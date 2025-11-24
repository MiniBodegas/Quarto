import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';

const AdminAuthorized = ({ authorizedPersons, companyProfiles }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPersons = useMemo(() => {
        const enhancedPersons = authorizedPersons.map(person => {
            const company = companyProfiles.find(c => c.id === person.company_id);
            return {
                ...person,
                companyName: company ? company.name : 'Cliente Desconocido'
            };
        });

        if (!searchTerm) return enhancedPersons;

        return enhancedPersons.filter(person =>
            person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.document_id.includes(searchTerm) ||
            person.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [authorizedPersons, companyProfiles, searchTerm]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Personas Autorizadas</h1>
                <p className="text-text-secondary mt-1">Consulta el registro de todas las personas autorizadas por los clientes.</p>
            </div>

            <Card>
                 <div className="mb-4">
                     <Input 
                        label="Buscar Persona Autorizada"
                        id="search-authorized"
                        placeholder="Buscar por nombre, documento o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredPersons.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Autorizado Por</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {filteredPersons.map(person => (
                                    <tr key={person.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{person.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{person.document_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{person.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{person.authorized_by || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-text-secondary py-8">No se encontraron personas autorizadas con los criterios de búsqueda.</p>
                )}
            </Card>
        </div>
    );
};

export default AdminAuthorized;
