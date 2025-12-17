import { useState, useCallback, useEffect } from 'react';

export const useInventory = () => {
  // ✅ CAMBIO CRÍTICO: Empezar con array vacío, no con items hardcodeados
  const [items, setItems] = useState([]);

  // ✅ Sincronizar localStorage automáticamente cuando cambien los items
  useEffect(() => {
    // Guardamos todos los items que tengan cantidad > 0
    const itemsToSave = items.filter(item => item.quantity > 0);
    
    // Siempre actualizar localStorage (incluso si está vacío)
    if (itemsToSave.length > 0) {
      localStorage.setItem('quarto_inventory', JSON.stringify(itemsToSave));
      console.log('[useInventory] 💾 Guardados', itemsToSave.length, 'items en localStorage');
    } else {
      // Si no hay items con cantidad, limpiar localStorage
      localStorage.removeItem('quarto_inventory');
      console.log('[useInventory] 🧹 localStorage limpiado (no hay items con cantidad)');
    }
  }, [items]);

  const updateItemQuantity = useCallback((id, quantity) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  }, []);

  const addItem = useCallback((newItemData) => {
    // ✅ Si el item ya tiene un ID válido (viene de DB), usarlo
    // Si no, crear un ID custom para items personalizados
    const fullNewItem = {
      ...newItemData,
      id: newItemData.id || `custom-${Date.now()}`,
      volume: newItemData.volume || parseFloat(
        (newItemData.width * newItemData.height * newItemData.depth).toFixed(1)
      ),
      isCustom: newItemData.isCustom ?? !newItemData.id, // Custom si no tiene ID de DB
    };
    setItems(prevItems => [...prevItems, fullNewItem]);
    return fullNewItem;
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    console.log('[useInventory] 🗑️ clearAll() - vaciando completamente + localStorage');
    setItems([]);
    localStorage.removeItem('quarto_inventory');
  }, []);

  const resetToDefaults = useCallback(() => {
    console.log('[useInventory] 🔄 resetToDefaults() - limpiando inventario');
    setItems([]);
    localStorage.removeItem('quarto_inventory');
  }, []);

  return {
    items,
    updateItemQuantity,
    addItem,
    removeItem,
    clearAll,
    resetToDefaults,
  };
};