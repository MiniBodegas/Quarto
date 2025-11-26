import { saveCustomItem } from './saveCustomItem';

// items: array de artículos personalizados del estado local
// userId: id del usuario recién autenticado
export async function migrateCustomItems(items, userId) {
    const customItems = items.filter(item => item.isCustom);
    for (const item of customItems) {
        await saveCustomItem(item, userId);
    }
}