import { NextResponse } from 'next/server';
import { normalizeProductData } from '@/lib/api/normalizeProduct';

export async function GET(
    request: Request,
    { params }: { params: { barcode: string } }
) {
    try {
        const barcode = params.barcode;

        // 1. Supabase Cache Check (mocked here, replace with real DB call)
        // const { data: cachedProduct } = await supabase.from('products').select('*').eq('barcode', barcode).single();
        // if (cachedProduct && Date.now() - new Date(cachedProduct.last_updated).getTime() < 7 * 24 * 60 * 60 * 1000) {
        //   return NextResponse.json(cachedProduct);
        // }

        // 2. Open Food Facts API Call
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const offData = await offRes.json();

        if (offData.status === 1) {
            const normalizedProduct = normalizeProductData(offData.product, 'off');

            // 3. Supabase Edge Function Call to calculate NutriScan Score
            // const scoreRes = await supabase.functions.invoke('calculate-score', { body: normalizedProduct });
            // normalizedProduct.nutriscan_score = scoreRes.data.nss;
            // normalizedProduct.score_breakdown = scoreRes.data.breakdown;

            // 4. Save to Cache
            // await supabase.from('products').upsert(normalizedProduct);

            return NextResponse.json({ success: true, data: normalizedProduct });
        }

        // Fallback USDA (skipped for brevity)
        return NextResponse.json({ success: false, error: 'Product not found anywhere' }, { status: 404 });

    } catch (error) {
        console.error('API /scan/[barcode] error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
