import { PRICE_LIST } from '../data/prices';
import { TRANSPORT_RATES } from '../data/transportRates';

/**
 * Calcula el precio mensual estimado de almacenamiento según el volumen total.
 * Usa el modelo de precios escalonado definido en PRICE_LIST.
 * Si el volumen excede el mayor escalón, extrapola el precio usando la tasa de los dos últimos escalones.
 *
 * @param {number} volume - Volumen total en m³.
 * @returns {number} Precio mensual estimado, redondeado. Retorna 0 si el volumen es cero o negativo.
 */
export const calculateStoragePrice = (volume) => {
    if (volume <= 0) {
        return 0;
    }

    const sortedPrices = [...PRICE_LIST].sort((a, b) => a.volume - b.volume);
    const suitableTier = sortedPrices.find(tier => tier.volume >= volume);

    if (suitableTier) {
        return suitableTier.price;
    }

    const maxTier = sortedPrices[sortedPrices.length - 1];
    if (sortedPrices.length < 2) {
        return maxTier ? maxTier.price : 0;
    }
    const secondMaxTier = sortedPrices[sortedPrices.length - 2];
    const volumeDiff = maxTier.volume - secondMaxTier.volume;
    if (volumeDiff <= 0) {
        return maxTier.price;
    }

    const pricePerM3Extra = (maxTier.price - secondMaxTier.price) / volumeDiff;
    const extraVolume = volume - maxTier.volume;
    const extraPrice = extraVolume * pricePerM3Extra;

    return Math.round(maxTier.price + extraPrice);
};

/**
 * Calcula el precio único de transporte según el volumen total.
 * Usa el modelo de tarifas escalonadas definido en TRANSPORT_RATES.
 * Si el volumen excede el mayor escalón, aplica un recargo fijo por cada m³ extra.
 *
 * @param {number} volume - Volumen total en m³.
 * @returns {number} Precio de transporte, redondeado. Retorna 0 si el volumen es cero o negativo.
 */
export const calculateTransportPrice = (volume) => {
    if (volume <= 0) {
        return 0;
    }

    const sortedRates = [...TRANSPORT_RATES].sort((a, b) => a.volume - b.volume);
    const suitableTier = sortedRates.find(tier => tier.volume >= volume);

    if (suitableTier) {
        return suitableTier.price;
    }

    const maxTier = sortedRates[sortedRates.length - 1];
    const pricePerM3Extra = 10000; // Recargo por m³ extra sobre el máximo
    const extraVolume = volume - maxTier.volume;
    const extraPrice = extraVolume * pricePerM3Extra;

    return Math.round(maxTier.price + extraPrice);
};