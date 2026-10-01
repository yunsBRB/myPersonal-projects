import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { barcode: string } }
) {
    try {
        const barcode = params.barcode;

        // Simulate fetching the original product's category
        const category = 'breakfast_cereals'; // Mock category for MVP

        // 1. Search Local Cache in Supabase (Mock)
        // const { data: localAlternatives } = await supabase
        //   .from('products')
        //   .select('*')
        //   .eq('category', category)
        //   .order('nutriscan_score', { ascending: false })
        //   .limit(3);

        // 2. Fallback to OpenFoodFacts Search API
        const offRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${category}&search_simple=1&action=process&json=1&page_size=5`);
        const offData = await offRes.json();

        // Sort and filter results (Mock logic simulating filtering for Nutriscore A/B)
        const alternatives = offData.products.slice(0, 3).map((p: any) => ({
            barcode: p.code,
            name: p.product_name || 'Alternative',
            brand: p.brands || 'Marque inconnue',
            image_url: p.image_url,
            nutriscore: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : 'B',
            nutriscan_score: Math.floor(Math.random() * (100 - 75 + 1)) + 75 // Random score between 75-100 for representation
        }));

        // In a real scenario, we check the user subscription state here.
        // If user is Free, we only return the first element.
        const isPremium = true;

        return NextResponse.json({
            success: true,
            category,
            alternatives: isPremium ? alternatives : [alternatives[0]]
        });

    } catch (error) {
        console.error('API /alternatives/[barcode] error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
