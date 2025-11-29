import { supabase } from '../supabase';

export async function saveTransport(data) {
    const { error } = await supabase
        .from('transports')
        .insert([data]);
    return error;
}

export default saveTransport;