import { supabase } from '../supabase/client'; // Assuming client file exists

export interface RawProductData {
    code: string;
    product_name_fr?: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    nutriments?: any;
    ingredients_text_fr?: string;
    ingredients_text?: string;
    additives_tags?: string[];
    allergens_tags?: string[];
}

export function normalizeProductData(raw: RawProductData, source: 'off' | 'usda' = 'off') {
    if (source === 'off') {
        return {
            barcode: raw.code,
            name: { fr: raw.product_name_fr || raw.product_name || 'Produit Inconnu', en: raw.product_name || '' },
            brand: raw.brands || 'Non spécifiée',
            image_url: raw.image_url || '',
            nutriscore: raw.nutriscore_grade ? raw.nutriscore_grade.toUpperCase() : 'UNKNOWN',
            nova_group: raw.nova_group || null,
            calories_100g: raw.nutriments?.['energy-kcal_100g'] || 0,
            proteins_100g: raw.nutriments?.['proteins_100g'] || 0,
            carbs_100g: raw.nutriments?.['carbohydrates_100g'] || 0,
            sugars_100g: raw.nutriments?.['sugars_100g'] || 0,
            fat_100g: raw.nutriments?.['fat_100g'] || 0,
            saturated_fat_100g: raw.nutriments?.['saturated-fat_100g'] || 0,
            fiber_100g: raw.nutriments?.['fiber_100g'] || 0,
            salt_100g: raw.nutriments?.['salt_100g'] || 0,
            ingredients_raw: raw.ingredients_text_fr || raw.ingredients_text || '',
            additives: (raw.additives_tags || []).map(tag => ({
                code: tag.replace('en:', '').toUpperCase(),
                name: tag.replace('en:', '').toUpperCase(),
                risk_level: 'unknown' // Will be augmented by AI or local DB later
            })),
            allergens: (raw.allergens_tags || []).map(a => a.replace('en:', '').replace('fr:', '')),
            source: 'off'
        };
    }

    // USDA normalization logic here
    return null;
}
