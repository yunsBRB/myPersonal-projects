import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface Product {
    nutriscore?: string;
    nova_group?: number | null;
    additives?: Array<{ code: string; risk_level: string }>;
    category?: string;
    fiber_100g?: number;
    sugars_100g?: number;
    carbs_100g?: number;
    proteins_100g?: number;
    calories_100g?: number;
}

interface UserProfile {
    health_goal?: string;
    diet_filters?: string[];
}

interface ScoreResult {
    nss: number;
    label: string;
    color: string;
    breakdown: any;
}

function getNSSLabel(score: number) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    if (score >= 20) return 'Mauvais';
    return 'Très mauvais';
}

function getNSSColor(score: number) {
    if (score >= 80) return '#1A7A4A'; // primary
    if (score >= 60) return '#2EA86B'; // primary-light
    if (score >= 40) return '#FCD34D'; // yellow
    if (score >= 20) return '#F97316'; // warning
    return '#EF4444'; // danger
}

// Simplified mock estimation functions for brevity
const estimateGlycemicIndex = (cat: any, f: any, s: any) => 50;
const countDeclaredMicronutrients = (p: any) => 2;

export function calculateNutriScanScore(product: Product, user?: UserProfile): ScoreResult {
    // 1. NUTRI-SCORE (25 pts max)
    const NS_MAP: Record<string, number> = { A: 25, B: 20, C: 12, D: 6, E: 0 };
    const baseNs = product.nutriscore ? product.nutriscore.toUpperCase() : 'C';
    const score_ns = NS_MAP[baseNs] ?? 12;

    // 2. NOVA — NIVEAU TRANSFORMATION (20 pts max)
    const NOVA_MAP: Record<number, number> = { 1: 20, 2: 15, 3: 7, 4: 0 };
    const score_nova = product.nova_group ? (NOVA_MAP[product.nova_group] ?? 7) : 7;

    // 3. ADDITIFS (20 pts max)
    let score_add = 20;
    if (product.additives) {
        for (const additive of product.additives) {
            if (additive.risk_level === 'banned') score_add -= 10;
            if (additive.risk_level === 'risky') score_add -= 5;
            if (additive.risk_level === 'moderate') score_add -= 2;
        }
    }
    score_add = Math.max(0, score_add);

    // 4. CHARGE GLYCÉMIQUE (15 pts max)
    const GI = estimateGlycemicIndex(product.category, product.fiber_100g, product.sugars_100g);
    const GL = (GI * (product.carbs_100g || 0)) / 100;
    const score_gl = Math.max(0, 15 - Math.min(15, GL / 2));

    // 5. DENSITÉ PROTÉIQUE (10 pts max)
    const cals = product.calories_100g || 1;
    const protein_ratio = ((product.proteins_100g || 0) * 4) / (cals > 0 ? cals : 1);
    const score_prot = Math.min(10, protein_ratio * 25);

    // 6. MICRONUTRIMENTS (5 pts max)
    const micro_count = countDeclaredMicronutrients(product);
    const score_micro = Math.min(5, micro_count);

    // 7. AJUSTEMENT PROFIL (±5 pts)
    let bonus = 0;
    // Implementation of bonus logic based on user profile would go here

    const total = score_ns + score_nova + score_add + score_gl + score_prot + score_micro + bonus;
    const nss = Math.round(Math.min(100, Math.max(0, total)));

    return {
        nss,
        label: getNSSLabel(nss),
        color: getNSSColor(nss),
        breakdown: { score_ns, score_nova, score_add, score_gl, score_prot, score_micro, bonus }
    };
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        const { product, user } = await req.json();
        const result = calculateNutriScanScore(product, user);
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
