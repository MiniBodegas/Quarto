import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { toProperCase } from '../utils/formatters';

const Inventory = ({ items, logs, storageUnits, onMovement }) => {
  // Detectar si es modo solo lectura (usuarios normales sin permisos de edición)
  const isReadOnly = !onMovement;

  // Initialize with the first unit if available
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
      if (storageUnits.length > 0) return storageUnits[0].id;
      return '';
  });

  // If storageUnits load later or change, update selection if empty
  useEffect(() => {
      if (storageUnits.length > 0 && !selectedUnitId) {
          setSelectedUnitId(storageUnits[0].id);
      }
  }, [storageUnits, selectedUnitId]);

  const [view, setView] = useState('current');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      category: '',
      quantity: 1,
      description: '',
      notes: '' // Used for logs
  });

  // Reset Form
  const resetForm = () => {
      setFormData({ name: '', category: '', quantity: 1, description: '', notes: '' });
      setSelectedItem(null);
  };

  // Filter Data based on Unit
  const unitItems = useMemo(() => items.filter(i => i.storage_unit_id === selectedUnitId), [items, selectedUnitId]);
  const unitLogs = useMemo(() => logs.filter(l => l.storage_unit_id === selectedUnitId), [logs, selectedUnitId]);

  const categories = Array.from(new Set(unitItems.map(i => i.category || 'Sin Categoría')));
  
  const filteredItems = unitItems.filter(item => {
    if (filterCategory === 'all') return true;
    return (item.category || 'Sin Categoría') === filterCategory;
  });

  const handleOpenCreate = () => {
      resetForm();
      setModalMode('create');
      setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
      setSelectedItem(item);
      setFormData({
          name: item.name,
          category: item.category || '',
          quantity: item.quantity,
          description: item.description || '',
          notes: ''
      });
      setModalMode('edit');
      setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
      setSelectedItem(item);
      setModalMode('delete');
      setIsModalOpen(true);
  }
  
  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedUnitId) return;
      
      // Basic validation
      if (!formData.name.trim()) return;
      if (modalMode === 'create' && formData.quantity < 0) return;

      setIsSaving(true);

      try {
        if (modalMode === 'create') {
            await onMovement(
                selectedUnitId,
                { 
                    name: toProperCase(formData.name), 
                    category: toProperCase(formData.category), 
                    description: formData.description 
                },
                formData.quantity,
                'create',
                formData.notes || 'Ingreso inicial'
            );
        } else if (modalMode === 'edit' && selectedItem) {
            await onMovement(
                selectedUnitId,
                { 
                    id: selectedItem.id,
                    name: toProperCase(formData.name), 
                    category: toProperCase(formData.category), 
                    description: formData.description 
                },
                0, // No quantity change on edit here (use quick adjust for that)
                'update',
                ''
            );
        } else if (modalMode === 'delete' && selectedItem) {
             await onMovement(
                selectedUnitId,
                { id: selectedItem.id },
                0,
                'delete',
                formData.notes
            );
        }

        setIsModalOpen(false);
        resetForm();
      } catch (error) {
          console.error(error);
      }
      setIsSaving(false);
  };

  // Quick Adjust Handler (+/- buttons)
  const handleQuickAdjust = async (item, amount) => {
      if (!selectedUnitId) return;
      await onMovement(
          selectedUnitId,
          { id: item.id, name: item.name },
          amount,
          amount > 0 ? 'entry' : 'exit',
          'Ajuste rápido'
      );
  };

  if (storageUnits.length === 0) {
      return (
          <div className="text-center py-10">
              <h2 className="text-xl font-semibold text-text-secondary">No tienes bodegas asignadas.</h2>
              <p className="text-text-secondary">Contáctanos para asignar tu primera bodega.</p>
          </div>
      )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
             <h1 className="text-3xl font-bold text-text-primary">Gestión de Inventario</h1>
             <p className="text-text-secondary">Administra tus pertenencias con total libertad.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
             {storageUnits.length > 1 ? (
                 <select 
                    className="bg-white border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary shadow-sm"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                 >
                     {storageUnits.map(u => <option key={u.id} value={u.id}>Bodega {u.number}</option>)}
                 </select>
             ) : (
                 <div className="bg-blue-50 text-primary px-4 py-2 rounded-md font-medium border border-blue-100">
                     Bodega {storageUnits[0].number}
                 </div>
             )}
             
             <div className="flex bg-card rounded-lg border border-border p-1">
                 <button 
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === 'current' ? 'bg-blue-50 text-primary font-medium' : 'text-text-secondary hover:bg-gray-50'}`}
                    onClick={() => setView('current')}
                 >
                     Mis Cosas
                 </button>
                 <button 
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === 'history' ? 'bg-blue-50 text-primary font-medium' : 'text-text-secondary hover:bg-gray-50'}`}
                    onClick={() => setView('history')}
                 >
                     Historial
                 </button>
             </div>
        </div>
      </div>

      {view === 'current' && (
        <>
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    {categories.length > 0 && (
                        <>
                            <span className="text-sm font-medium text-text-secondary hidden sm:inline">Categoría:</span>
                            <select 
                                className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Todas</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </>
                    )}
                </div>
                {!isReadOnly && (
                  <Button onClick={handleOpenCreate} className="shadow-sm">
                      <span className="material-symbols-outlined text-sm mr-1">add</span> Agregar Artículo
                  </Button>
                )}
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-gray-50">
                            <tr>
                                {isReadOnly && (
                                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Código</th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Artículo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">Detalles</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cantidad</th>
                                {!isReadOnly && (
                                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredItems.length > 0 ? filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 group">
                                    {isReadOnly && (
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                          {item.short_code || 'N/A'}
                                        </span>
                                      </td>
                                    )}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="font-medium text-text-primary text-base">{item.name}</div>
                                        {item.category && <div className="text-xs text-text-secondary sm:hidden">{item.category}</div>}
                                    </td>
                                    <td className="px-4 py-4 hidden sm:table-cell align-middle">
                                        {item.category && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                                                {item.category}
                                            </span>
                                        )}
                                        <div className="text-sm text-text-secondary truncate max-w-[200px]">{item.description || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap align-middle">
                                        {isReadOnly ? (
                                          <span className="font-bold text-text-primary text-base">{item.quantity}</span>
                                        ) : (
                                          <div className="flex items-center space-x-3">
                                              <button 
                                                  onClick={() => handleQuickAdjust(item, -1)} 
                                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center disabled:opacity-50 transition-colors" 
                                                  disabled={item.quantity <= 0}
                                                  title="Restar 1"
                                              >
                                                  <span className="material-symbols-outlined text-sm">remove</span>
                                              </button>
                                              <span className="font-bold text-text-primary text-lg w-8 text-center">{item.quantity}</span>
                                              <button 
                                                  onClick={() => handleQuickAdjust(item, 1)} 
                                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                                                  title="Sumar 1"
                                              >
                                                  <span className="material-symbols-outlined text-sm">add</span>
                                              </button>
                                          </div>
                                        )}
                                    </td>
                                    {!isReadOnly && (
                                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                                          <div className="flex justify-end items-center gap-1">
                                              <button onClick={() => handleOpenEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                                                  <span className="material-symbols-outlined text-xl">edit</span>
                                              </button>
                                              <button onClick={() => handleOpenDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
                                                  <span className="material-symbols-outlined text-xl">delete</span>
                                              </button>
                                          </div>
                                      </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isReadOnly ? 4 : 4} className="px-6 py-12 text-center text-text-secondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-30">inventory_2</span>
                                            <p className="mb-4 text-lg">
                                              {isReadOnly 
                                                ? 'No hay objetos registrados en esta bodega.' 
                                                : 'Esta bodega está vacía.'}
                                            </p>
                                            {!isReadOnly && (
                                              <Button variant="secondary" onClick={handleOpenCreate}>Agregar mi primer artículo</Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
      )}

      {view === 'history' && (
          <Card>
               <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Artículo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Cambio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {unitLogs.length > 0 ? unitLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 whitespace-nowrap text-xs text-text-secondary">{log.date}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-text-primary">
                                    <span className="font-medium">{log.item_name}</span>
                                    {log.action === 'delete' && <span className="text-xs text-red-500 ml-2 bg-red-50 px-1 rounded">(Eliminado)</span>}
                                    {log.action === 'create' && <span className="text-xs text-green-500 ml-2 bg-green-50 px-1 rounded">(Nuevo)</span>}
                                </td>
                                <td className={`px-6 py-3 whitespace-nowrap text-right text-sm font-bold ${log.quantity_change > 0 ? 'text-green-600' : (log.quantity_change < 0 ? 'text-red-600' : 'text-gray-500')}`}>
                                    {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                </td>
                                <td className="px-6 py-3 text-xs text-text-secondary italic max-w-xs truncate">
                                    {log.notes || '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                                    No hay historial de movimientos registrado para esta bodega.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </Card>
      )}

      {/* CRUD Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? 'Nuevo Artículo' : (modalMode === 'edit' ? 'Editar Artículo' : 'Eliminar Artículo')}
      >
          <form onSubmit={handleSubmit} className="space-y-4">
              {modalMode === 'delete' ? (
                  <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-600">delete_forever</span>
                      </div>
                      <p className="text-text-primary mb-2 text-lg">¿Eliminar <strong>{selectedItem?.name}</strong>?</p>
                      <p className="text-sm text-text-secondary mb-6">Desaparecerá de tu lista actual, pero se guardará en el historial.</p>
                      <div className="flex justify-center gap-3">
                          <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                          <Button variant="danger" type="submit" disabled={isSaving}>
                              {isSaving ? <Spinner size="sm"/> : 'Sí, Eliminar'}
                          </Button>
                      </div>
                  </div>
              ) : (
                  <>
                    <div>
                        <Input 
                            label="Nombre del Artículo *" 
                            id="inv-item-name" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                            placeholder="Ej: Cajas de Archivo"
                        />
                    </div>
                    
                    {modalMode === 'create' && (
                         <div>
                            <Input 
                                label="Cantidad Inicial *" 
                                type="number" 
                                min="0" 
                                id="inv-item-quantity" 
                                value={formData.quantity.toString()} 
                                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} 
                                required 
                            />
                            <p className="text-xs text-text-secondary mt-1">La cantidad es obligatoria para registrar el ingreso.</p>
                         </div>
                    )}

                    <Input 
                        label="Categoría (Opcional)" 
                        id="inv-item-category" 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        placeholder="Ej: Muebles, Documentos"
                    />

                    <div>
                        <label htmlFor="inv-item-description" className="block text-sm font-medium text-text-secondary mb-1">Descripción (Opcional)</label>
                        <textarea
                            id="inv-item-description"
                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    {modalMode === 'create' && (
                        <Input 
                            label="Notas del Movimiento (Opcional)" 
                            id="inv-item-notes" 
                            value={formData.notes} 
                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                            placeholder="Ej: Ingreso inicial..."
                        />
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving || !formData.name.trim() || (modalMode === 'create' && formData.quantity === undefined)}>
                            {isSaving ? <Spinner size="sm"/> : (modalMode === 'create' ? 'Guardar' : 'Actualizar')}
                        </Button>
                    </div>
                  </>
              )}
          </form>
      </Modal>

    </div>
  );
};

export default Inventory;