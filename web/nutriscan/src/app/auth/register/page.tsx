'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Dummy registration flow for UI presentation
    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else router.push('/app'); // End of flow
    };

    return (
        <Card className="rounded-[24px] shadow-2xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-2 bg-white">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
                    N
                </div>
                <CardTitle className="text-2xl font-extrabold text-foreground tracking-tight">
                    {step === 1 ? 'Créer un compte' : step === 2 ? 'Vos Objectifs' : 'Régimes & Allergies'}
                </CardTitle>
                <CardDescription>
                    {step === 1 ? 'Rejoignez NutriScan aujourd\'hui' : step === 2 ? 'Adaptation de vos recommandations' : 'Personnalisation du profil'}
                </CardDescription>
            </CardHeader>

            <CardContent className="bg-white px-6 py-6 min-h-[300px] flex flex-col justify-center">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="jean@exemple.com" required className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input id="password" type="password" required className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Prénom</Label>
                            <Input id="name" type="text" placeholder="Jean" required className="h-12 rounded-xl" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-2 gap-3">
                        {['Perte de poids', 'Muscle', 'Diabète', 'Cholestérol', 'Maintien forme', 'Général'].map(goal => (
                            <button key={goal} className="p-4 border-2 border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors hover:bg-primary/5 active:scale-95">
                                {goal}
                            </button>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block text-muted-foreground font-bold text-xs uppercase tracking-wider">Régimes</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Vegan', 'Halal', 'Kosher', 'Sans Gluten', 'Keto'].map(diet => (
                                    <button key={diet} className="px-4 py-2 border border-border rounded-full text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
                                        {diet}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="mb-2 block text-muted-foreground font-bold text-xs uppercase tracking-wider">Allergènes fréquents</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Arachides', 'Lait', 'Soja', 'Œufs', 'Poisson'].map(allergy => (
                                    <button key={allergy} className="px-4 py-2 border border-border rounded-full text-sm font-semibold hover:bg-destructive hover:text-white transition-colors">
                                        {allergy}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/30 p-6 flex flex-col gap-4 border-t border-border">
                <Button onClick={handleNext} className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                    {step === 3 ? 'Terminer & Commencer' : 'Continuer'}
                </Button>
                {step === 1 && (
                    <p className="text-sm text-center text-muted-foreground font-medium">
                        Déjà inscrit ?{' '}
                        <Link href="/auth/login" className="text-primary font-bold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                )}
            </CardFooter>
        </Card>
    );
}
