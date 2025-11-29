import { supabase } from "../supabase";

export async function saveStorageRequest({
    bookingId = null,
    transportId = null,
    quoteId = null,
    totalItems,
    totalVolume,
    logisticMethod,
    itemType,
    estimatedValue,
    items
}) {
    const { error } = await supabase
    .from ('storage_requests')
    .insert([{
         bookingId,
    transportId,
    quoteId,
    totalItems,
    totalVolume,
    logisticMethod,
    itemType,
    estimatedValue,
    items: JSON.stringify(items)
  }]);
    return error;
}

export default saveStorageRequest;