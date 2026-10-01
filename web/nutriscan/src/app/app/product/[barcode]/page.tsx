'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check, X, ShieldAlert, Heart, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import PremiumGate from '@/components/PremiumGate';

// Mock Data for MVP visualization
const MOCK_PRODUCT = {
    barcode: '3017620422003',
    name: 'Pâte à Tartiner Nutella',
    brand: 'Ferrero',
    image: '🍫',
    nutriscore: 'E',
    nova_group: 4,
    nutriscan_score: 18,
    calories: 539,
    proteins: 6.3,
    carbs: 57.5,
    fat: 30.9,
    additives: [
        { code: 'E322', name: 'Lécithines', risk_level: 'safe' },
        { code: 'E150d', name: 'Caramel au sulfite d\'ammonium', risk_level: 'moderate' }
    ],
    allergens: ['Noisettes', 'Lait', 'Soja'],
    diets: { vegan: false, halal: true, kosher: true, gluten_free: true, keto: false },
};

export default function ProductResultPage({ params }: { params: { barcode: string } }) {
    const router = useRouter();

    // Fake animation loading state
    const [loading, setLoading] = useState(true);
    React.useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground font-medium animate-pulse">Analyse nutritionnelle en cours...</p>
            </div>
        );
    }

    // --- Helpers ---
    const getNSSColor = (score: number) => {
        if (score >= 80) return 'text-primary border-primary bg-primary/10';
        if (score >= 50) return 'text-yellow-600 border-yellow-600 bg-yellow-600/10';
        if (score >= 30) return 'text-warning border-warning bg-warning/10';
        return 'text-destructive border-destructive bg-destructive/10';
    };

    const getNutriscoreColor = (ns: string) => {
        switch (ns.toUpperCase()) {
            case 'A': return 'bg-emerald-600 text-white';
            case 'B': return 'bg-green-500 text-white';
            case 'C': return 'bg-yellow-400 text-slate-900';
            case 'D': return 'bg-orange-500 text-white';
            case 'E': return 'bg-red-600 text-white';
            default: return 'bg-gray-300 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <span className="font-bold text-sm">Produit Scanné</span>
                <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
                    <Heart className="w-6 h-6 text-muted-foreground" />
                </button>
            </div>

            <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">

                {/* A) HERO CARD & CIRCULAR SCORE */}
                <section className="flex gap-6 items-center">
                    <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-2xl flex items-center justify-center text-6xl shadow-sm border border-border">
                        {MOCK_PRODUCT.image}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-2xl font-extrabold text-foreground leading-tight">{MOCK_PRODUCT.name}</h1>
                        <p className="text-muted-foreground font-medium">{MOCK_PRODUCT.brand}</p>

                        {/* Circular SVG NutriScan Score */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="relative w-16 h-16">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <path className="text-muted stroke-current" strokeWidth="3" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    {/* Foreground Circle - Animated */}
                                    <motion.path
                                        initial={{ strokeDasharray: "0, 100" }}
                                        animate={{ strokeDasharray: `${MOCK_PRODUCT.nutriscan_score}, 100` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`${MOCK_PRODUCT.nutriscan_score > 50 ? 'text-primary' : 'text-destructive'} stroke-current`}
                                        strokeWidth="3" strokeLinecap="round" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-lg font-black leading-none">{MOCK_PRODUCT.nutriscan_score}</span>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">/100</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground">NutriScan Score</span>
                                <span className={`text-xs font-bold ${MOCK_PRODUCT.nutriscan_score > 50 ? 'text-primary' : 'text-destructive'}`}>
                                    {MOCK_PRODUCT.nutriscan_score > 50 ? 'Excellent choix' : 'À éviter'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* B) RATINGS (Nutri-Score & NOVA) */}
                <section className="grid grid-cols-2 gap-3">
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nutri-Score</span>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-inner ${getNutriscoreColor(MOCK_PRODUCT.nutriscore)}`}>
                                {MOCK_PRODUCT.nutriscore}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Groupe NOVA</span>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-inner ${MOCK_PRODUCT.nova_group === 4 ? 'bg-destructive text-white' : 'bg-primary text-white'}`}>
                                {MOCK_PRODUCT.nova_group}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight">
                                {MOCK_PRODUCT.nova_group === 4 ? 'Ultra-transformé' : 'Non transformé'}
                            </span>
                        </CardContent>
                    </Card>
                </section>

                {/* C) TABLEAU NUTRITIONNEL (Pour 100g) */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-3">Repères nutritionnels</h2>
                    <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                        <div className="grid grid-cols-4 divide-x divide-border">
                            <div className="p-3 flex flex-col items-center justify-center bg-muted/30">
                                <span className="text-lg font-bold">{MOCK_PRODUCT.calories}</span>
                                <span className="text-xs text-muted-foreground">kcal</span>
                            </div>
                            <div className="p-3 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold">{MOCK_PRODUCT.proteins}g</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Protéines</span>
                            </div>
                            <div className="p-3 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold">{MOCK_PRODUCT.carbs}g</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Glucides</span>
                            </div>
                            <div className="p-3 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-destructive">{MOCK_PRODUCT.fat}g</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Lipides</span>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* E) ADDITIFS ALIMENTAIRES */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-3 flex justify-between items-center">
                        Additifs
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive">{MOCK_PRODUCT.additives.length} détectés</Badge>
                    </h2>
                    <Card className="rounded-2xl shadow-sm border-border">
                        <Accordion type="single" collapsible className="w-full">
                            {MOCK_PRODUCT.additives.map((add, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0 border-border px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${add.risk_level === 'safe' ? 'bg-primary' : add.risk_level === 'moderate' ? 'bg-warning' : 'bg-destructive'}`}></div>
                                            <span className="font-bold text-sm">{add.code}</span>
                                            <span className="text-sm text-muted-foreground truncate w-32 text-left">{add.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                                        Cet additif est évalué comme ayant un risque <strong>{add.risk_level === 'safe' ? 'faible' : add.risk_level === 'moderate' ? 'modéré' : 'élevé'}</strong>.
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>
                </section>

                {/* F) ALLERGÈNES & RÉGIMES */}
                <section className="grid grid-cols-1 gap-6">
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Allergènes</h2>
                        <div className="flex flex-wrap gap-2">
                            {MOCK_PRODUCT.allergens.map((alg) => (
                                <Badge key={alg} variant="outline" className="bg-destructive/10 text-destructive border-transparent">
                                    {alg}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Compatibilité</h2>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(MOCK_PRODUCT.diets).map(([key, isCompatible]) => (
                                <Badge key={key} variant="outline" className={`border-transparent ${isCompatible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground opacity-50'}`}>
                                    {isCompatible ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                    {key.replace('_', ' ')}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>

                {/* H) PREMIUM: IMPACT SANTÉ */}
                <section>
                    <PremiumGate feature="Impact Santé">
                        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Impact Santé (AI)
                        </h2>
                        <Card className="rounded-2xl shadow-sm border-border p-4 space-y-4">
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-1">
                                    <span>Risque Diabète</span>
                                    <span className="text-warning">Modéré</span>
                                </div>
                                <Progress value={65} className="h-2 [&>div]:bg-warning" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-1">
                                    <span>Impact Cholestérol</span>
                                    <span className="text-destructive">Élevé</span>
                                </div>
                                <Progress value={85} className="h-2 [&>div]:bg-destructive" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-semibold mb-1">
                                    <span>Digestion</span>
                                    <span className="text-primary">Bon</span>
                                </div>
                                <Progress value={30} className="h-2 [&>div]:bg-primary" />
                            </div>
                        </Card>
                    </PremiumGate>
                </section>

                {/* I) PREMIUM: ALTERNATIVES */}
                <section>
                    <PremiumGate feature="Alternatives Saines">
                        <h2 className="text-lg font-bold text-foreground mb-3 flex justify-between items-center">
                            Alternatives Saines
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="min-w-[160px] rounded-2xl shadow-sm border-border flex-shrink-0">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-muted rounded-xl mb-3 flex items-center justify-center text-2xl">🍯</div>
                                        <h3 className="font-bold text-sm leading-tight mb-1">Alternative Bio {i}</h3>
                                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">85 NSS</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </PremiumGate>
                </section>

            </main>
        </div>
    );
}
