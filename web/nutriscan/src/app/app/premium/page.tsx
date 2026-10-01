'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Star, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
    { name: 'Scan illimité (Code-barres)', free: true, premium: true },
    { name: 'Nutri-score & NOVA', free: true, premium: true },
    { name: 'Score NutriScan Classique', free: true, premium: true },
    { name: 'Historique des scans (7 jours)', free: true, premium: true },
    { name: 'Historique illimité', free: false, premium: true },
    { name: 'Analyse IA des ingrédients', free: false, premium: true },
    { name: 'Alternatives saines illimitées', free: false, premium: true },
    { name: 'Impact Santé détaillé (Diabète...)', free: false, premium: true },
    { name: 'Générateur de recettes IA', free: false, premium: true },
    { name: 'Filtres Régimes avancés (Keto, Halal...)', free: false, premium: true },
    { name: 'Scan Photo (Texte et tableaux)', free: false, premium: true },
    { name: 'Mode hors ligne', free: false, premium: true },
    { name: 'Coach Nutritionnel Hebdomadaire', free: false, premium: true },
    { name: 'Accès prioritaire (sans pub)', free: false, premium: true },
    { name: 'Support Premium 24/7', free: false, premium: true },
];

const REVIEWS = [
    { name: 'Sarah M.', content: "Les alternatives Premium m'ont aidé à réduire mon sucre de moitié !", stars: 5 },
    { name: 'Thomas D.', content: "Les recettes IA sont bluffantes. Je n'ai plus jamais de panne d'idée.", stars: 5 },
    { name: 'Amine R.', content: "Le filtre Halal et la détection d'additifs douteux sont géniaux.", stars: 5 },
];

export default function PremiumPage() {
    const router = useRouter();
    const [isYearly, setIsYearly] = useState(true);

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Dynamic Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <span className="font-bold text-sm tracking-wide text-primary">NutriScan Premium</span>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            <main className="px-4 py-8 max-w-lg mx-auto space-y-10">

                {/* Header Text */}
                <section className="text-center space-y-4">
                    <Badge className="bg-gradient-to-r from-orange-400 to-warning text-white border-0 font-extrabold uppercase tracking-widest px-4 py-1.5 shadow-lg shadow-warning/20">
                        Passez au niveau supérieur
                    </Badge>
                    <h1 className="text-3xl font-black text-foreground leading-tight">
                        Votre santé mérite <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">le meilleur accompagnement</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Débloquez l'IA de NutriScan et découvrez l'impact réel de votre alimentation.
                    </p>
                </section>

                {/* Pricing Toggle & CTA */}
                <section className="bg-card rounded-3xl p-6 shadow-xl border border-border flex flex-col items-center">
                    <div className="bg-muted p-1 rounded-full flex items-center relative w-full max-w-xs mb-8">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${isYearly ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
                        ></div>
                        <button
                            className={`flex-1 flex items-center justify-center py-2.5 z-10 font-bold text-sm transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setIsYearly(false)}
                        >
                            Mensuel
                        </button>
                        <button
                            className={`flex-1 flex flex-col items-center justify-center py-1.5 z-10 font-bold text-sm transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
                            onClick={() => setIsYearly(true)}
                        >
                            <span>Annuel</span>
                            <span className="text-[9px] text-white bg-warning px-1.5 py-0.5 rounded-full absolute -top-3 -right-2 font-black shadow-sm">-50%</span>
                        </button>
                    </div>

                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-5xl font-black text-foreground">{isYearly ? '59.99€' : '9.99€'}</span>
                        <span className="text-muted-foreground font-semibold mb-2">/{isYearly ? 'an' : 'mois'}</span>
                    </div>

                    <button className="w-full bg-foreground hover:bg-black text-white font-bold py-4 px-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mb-4">
                        Continuer vers le paiement
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                    <p className="text-xs text-muted-foreground font-medium text-center">Annulable à tout moment. Paiement sécurisé par Stripe.</p>
                </section>

                {/* Comparison Table */}
                <section>
                    <h2 className="text-xl font-bold text-foreground mb-6">Fonctionnalités incluses</h2>
                    <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm">
                        <div className="grid grid-cols-6 border-b border-border bg-muted/50 p-4">
                            <div className="col-span-4 font-bold text-sm">Fonctionnalité</div>
                            <div className="col-span-1 text-center font-bold text-sm text-muted-foreground">Free</div>
                            <div className="col-span-1 text-center font-bold text-sm text-primary">Pro</div>
                        </div>

                        <div className="divide-y divide-border">
                            {FEATURES.map((feat, idx) => (
                                <div key={idx} className="grid grid-cols-6 p-4 items-center hover:bg-muted/10 transition-colors">
                                    <div className="col-span-4 text-sm font-medium text-foreground pr-2">{feat.name}</div>
                                    <div className="col-span-1 flex justify-center">
                                        {feat.free ? <Check className="w-5 h-5 text-muted-foreground" /> : <X className="w-5 h-5 text-muted-foreground/30" />}
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {feat.premium ? <Check className="w-5 h-5 text-primary" /> : <X className="w-5 h-5 text-muted-foreground/30" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Reviews */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Ils ont choisi Premium</h2>
                    <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 custom-scrollbar">
                        {REVIEWS.map((review, idx) => (
                            <Card key={idx} className="min-w-[280px] rounded-2xl border-border shadow-sm flex-shrink-0">
                                <CardContent className="p-5">
                                    <div className="flex text-warning mb-3">
                                        {[...Array(review.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-4">"{review.content}"</p>
                                    <p className="text-xs font-bold text-muted-foreground">{review.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
