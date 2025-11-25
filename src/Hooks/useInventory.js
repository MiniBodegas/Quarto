import { useState, useCallback } from 'react';
import { getInitialItems } from '../data/constants';

export const useInventory = () => {
    const [items, setItems] = useState(() => getInitialItems());

    const updateItemQuantity = useCallback((id, quantity) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
            )
        );
    }, []);
    
    const addItem = useCallback((newItemData) => {
        const fullNewItem = {
            ...newItemData,
            id: `custom-${Date.now()}`,
            volume: parseFloat((newItemData.width * newItemData.height * newItemData.depth).toFixed(1)),
            isCustom: true,
        };
        setItems(prevItems => [...prevItems, fullNewItem]);
        return fullNewItem;
    }, []);

    const removeItem = useCallback((id) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setItems(getInitialItems());
    }, []);

    return {
        items,
        updateItemQuantity,
        addItem,
        removeItem,
        clearAll,
    };
};
