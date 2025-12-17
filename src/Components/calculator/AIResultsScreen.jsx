import { useState } from 'react';
import {  } from './ScreenHeader';
import Summary from './Summary';
import { Button, ScreenHeader} from '../../Components';

const AIResultsScreen = ({ 
  analysisResult, 
  onContinue, 
  onBack,
  onAddMorePhotos 
}) => {
  const [items, setItems] = useState(analysisResult?.items || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    lengthM: 0,
    widthM: 0,
    heightM: 0,
    volumeM3: 0,
    category: 'Varios'
  });

  // Calcular totales
  const totalVolume = items.reduce((sum, item) => sum + (item.volumeM3 || 0), 0);
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Convertir items para el Summary (formato compatible)
  const summaryItems = items.map((item, index) => ({
    id: index,
    name: item.name,
    quantity: item.quantity,
    volume: item.volumeM3 / item.quantity, // volumen por unidad
  }));

  const openAddModal = () => {
    setFormData({
      name: '',
      quantity: 1,
      lengthM: 0,
      widthM: 0,
      heightM: 0,
      volumeM3: 0,
      category: 'Varios'
    });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item, index) => {
    setFormData(item);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("El nombre es requerido");
      return;
    }

    const updatedItem = {
      ...formData,
      volumeM3: formData.lengthM * formData.widthM * formData.heightM * formData.quantity
    };

    if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = updatedItem;
      setItems(newItems);
    } else {
      setItems([...items, updatedItem]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleRemoveFromSummary = (id) => {
    setItems(items.filter((_, i) => i !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar todo el inventario?')) {
      setItems([]);
    }
  };

  const handleContinue = () => {
    // Convertir items al formato que espera la calculadora
    const formattedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      volume: item.volumeM3 / item.quantity, // volumen por unidad
      width: item.widthM,
      height: item.heightM,
      depth: item.lengthM,
      isCustom: true,
      category: item.category
    }));
    
    onContinue(formattedItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
      <ScreenHeader
        title="Resultados del Análisis"
        subtitle={analysisResult?.summary || "Revisa y edita los objetos detectados"}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna izquierda: Lista de items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#012E58]">
                    Inventario Detectado
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {items.length} objetos encontrados
                  </p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-[#074BED] text-white px-4 py-2 rounded-xl hover:bg-[#0640CC] transition-colors font-medium shadow-md active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Agregar</span>
                </button>
              </div>

              {/* Desktop: Tabla */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-xs uppercase tracking-wider text-slate-600">
                      <th className="p-4 text-left font-semibold">Objeto</th>
                      <th className="p-4 text-center font-semibold">Cant.</th>
                      <th className="p-4 text-right font-semibold">Dimensiones (m)</th>
                      <th className="p-4 text-right font-semibold">Volumen (m³)</th>
                      <th className="p-4 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">
                          No hay objetos detectados.
                          <button onClick={openAddModal} className="block mx-auto mt-2 text-[#074BED] font-medium hover:underline">
                            Agrega uno manualmente
                          </button>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4">
                            <p className="font-semibold text-[#012E58] mb-1">{item.name}</p>
                            <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 text-center text-[#012E58] font-medium">
                            {item.quantity}
                          </td>
                          <td className="p-4 text-right text-slate-600 text-sm font-mono">
                            {item.lengthM.toFixed(2)} × {item.widthM.toFixed(2)} × {item.heightM.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-bold text-[#074BED] text-lg">
                            {item.volumeM3.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => openEditModal(item, idx)}
                                className="p-2 text-slate-400 hover:text-[#074BED] hover:bg-blue-100 rounded-lg transition-all"
                                title="Editar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(idx)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                title="Eliminar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    No hay objetos detectados.
                    <button onClick={openAddModal} className="block mx-auto mt-2 text-[#074BED] font-medium hover:underline">
                      Agrega uno manualmente
                    </button>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-[#012E58] text-lg">{item.name}</h4>
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block mt-1">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-bold text-[#074BED] text-xl ml-2">
                          {item.volumeM3.toFixed(2)} m³
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mb-3">
                        <div>
                          <span className="text-slate-400 text-xs block uppercase">Cantidad</span>
                          <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-xs block uppercase">Dimensiones</span>
                          <span className="font-medium font-mono text-xs">
                            {item.lengthM.toFixed(1)}×{item.widthM.toFixed(1)}×{item.heightM.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex border-t border-slate-100 pt-3 divide-x divide-slate-100">
                        <button 
                          onClick={() => openEditModal(item, idx)} 
                          className="flex-1 flex items-center justify-center gap-2 text-[#074BED] text-sm font-medium py-1 active:bg-blue-50 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(idx)} 
                          className="flex-1 flex items-center justify-center gap-2 text-red-600 text-sm font-medium py-1 active:bg-red-50 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botón adicional: Analizar más fotos */}
            <button
              onClick={onAddMorePhotos}
              className="w-full py-3 bg-white border-2 border-[#074BED] text-[#074BED] rounded-xl font-medium hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Analizar más fotos
            </button>
          </div>

          {/* Columna derecha: Summary */}
          <div className="lg:col-span-1">
            <Summary
              totalVolume={totalVolume}
              totalItems={totalItems}
              selectedItems={summaryItems}
              onContinue={handleContinue}
              onClearAll={handleClearAll}
              onRemoveItem={handleRemoveFromSummary}
            />
          </div>
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-[#012E58]">
                {editingIndex !== null ? 'Editar Objeto' : 'Agregar Objeto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] focus:border-[#074BED] outline-none"
                  placeholder="Ej: Sofá 3 plazas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] outline-none bg-white"
                  >
                    <option value="Sala de estar">Sala de estar</option>
                    <option value="Comedor y cocina">Comedor y cocina</option>
                    <option value="Dormitorio">Dormitorio</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Varios">Varios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Dimensiones (Metros)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Largo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.lengthM}
                      onChange={(e) => setFormData({...formData, lengthM: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Ancho</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.widthM}
                      onChange={(e) => setFormData({...formData, widthM: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Alto</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.heightM}
                      onChange={(e) => setFormData({...formData, heightM: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#074BED] outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="text-[#074BED] font-medium text-sm">Volumen Total</span>
                <span className="text-xl font-bold text-[#012E58]">
                  {(formData.lengthM * formData.widthM * formData.heightM * formData.quantity).toFixed(2)} m³
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 text-slate-700 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-3 bg-[#074BED] text-white font-medium rounded-xl hover:bg-[#0640CC] transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResultsScreen;
