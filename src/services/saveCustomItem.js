import { supabase } from '../supabase';

export async function saveCustomItem(item, userId) {
    const { data, error } = await supabase
        .from('custom_items')
        .insert([{ ...item, user_id: userId }]);
    return { data, error };
}

export default saveCustomItem;