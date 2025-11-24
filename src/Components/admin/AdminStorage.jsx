import React from 'react';
import Card from '../ui/Card';

const AdminStorage = ({ storageUnits, companyProfiles }) => {

    const getCompanyName = (companyId) => {
        if (!companyId) return 'N/A';
        const company = companyProfiles.find(c => c.id === companyId);
        return company ? company.name : 'Cliente Desconocido';
    };

    const occupiedCount = storageUnits.filter(u => u.status === 'occupied').length;
    const vacantCount = storageUnits.length - occupiedCount;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestión de Bodegas</h1>
                    <p className="text-text-secondary mt-1">Mapa visual de ocupación.</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></span>
                        <span>Ocupada ({occupiedCount})</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></span>
                        <span>Disponible ({vacantCount})</span>
                    </div>
                </div>
            </div>
            
            {/* Visual Grid Layout mimicking a warehouse floor plan */}
            <Card className="overflow-hidden bg-gray-100/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {storageUnits.map(unit => {
                        const isOccupied = unit.status === 'occupied';
                        return (
                            <div 
                                key={unit.id} 
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all duration-200 group
                                    ${isOccupied 
                                        ? 'bg-white border-red-200 hover:border-red-400' 
                                        : 'bg-white border-green-200 hover:border-green-400 border-dashed'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-lg font-bold ${isOccupied ? 'text-gray-800' : 'text-green-600'}`}>
                                        {unit.number}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                </div>
                                
                                <div className="min-h-[3rem]">
                                    {isOccupied ? (
                                        <>
                                            <p className="text-xs text-text-secondary uppercase tracking-wide">Cliente</p>
                                            <p className="text-sm font-medium text-text-primary truncate" title={getCompanyName(unit.company_id)}>
                                                {getCompanyName(unit.company_id)}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center">
                                            <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                                Disponible
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Hover Tooltip-like effect */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default AdminStorage;
