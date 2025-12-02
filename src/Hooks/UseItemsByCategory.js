import { useEffect, useState } from 'react';
import supabase from '../supabase';

export function useItemsByCategory() {
    const [categories, setCategories] = useState([]);
    const [itemsByCategory, setItemsByCategory] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: catData, error: catError } = await supabase.from('categories').select('*');
            const { data: itemsData, error: itemsError } = await supabase.from('items').select('*');
            if (catError || itemsError) {
                setCategories([]);
                setItemsByCategory({});
                setLoading(false);
                return;
            }
            setCategories(catData);
            // Calcula volume si no existe
            const itemsWithVolume = itemsData.map(item => {
                const w = Number(item.width ?? 0);
                const h = Number(item.height ?? 0);
                const d = Number(item.depth ?? 0);
                let volume = item.volume;
                if (typeof volume !== 'number' || isNaN(volume)) {
                    volume = (w > 0 && h > 0 && d > 0) ? Number((w * h * d).toFixed(2)) : 0;
                }
                // Inicializa quantity en 0 si no existe
                const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                return { ...item, volume, quantity };
            });
            // Agrupa los items por categoryId
            const grouped = {};
            catData.forEach(cat => grouped[cat.id] = []);
            itemsWithVolume.forEach(item => {
                if (grouped[item.categoryId]) {
                    grouped[item.categoryId].push(item);
                } else {
                    if (!grouped['varios']) grouped['varios'] = [];
                    grouped['varios'].push(item);
                }
            });
            setItemsByCategory(grouped);
            setLoading(false);
        }
        fetchData();
    }, []);

    return { categories, itemsByCategory, loading };
}
