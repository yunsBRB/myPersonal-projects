'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/userStore';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useUserStore();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation of login
        setUser({
            id: 'mock-id',
            email: 'user@example.com',
            name: 'John Doe',
            country: 'FR',
            language: 'fr-FR',
            diet_filters: [],
            allergies: [],
        });
        router.push('/app');
    };

    return (
        <Card className="rounded-[24px] shadow-2xl border-0 overflow-hidden">
            <CardHeader className="text-center pb-2 bg-white">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg shadow-primary/30">
                    N
                </div>
                <CardTitle className="text-2xl font-extrabold text-foreground tracking-tight">Bon retour</CardTitle>
                <CardDescription>Connectez-vous à votre compte NutriScan</CardDescription>
            </CardHeader>

            <CardContent className="bg-white px-6 py-6">
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="jean@exemple.com" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Link href="/auth/forgot" className="text-xs text-primary font-semibold hover:underline">Mot de passe oublié ?</Link>
                        </div>
                        <Input id="password" type="password" required className="h-12 rounded-xl" />
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 mt-2">
                        Se connecter
                    </Button>
                </form>

                <div className="relative mt-8 mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground font-semibold">Ou continuer avec</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 rounded-xl font-semibold border-border">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
                        Google
                    </Button>
                    <Button variant="outline" className="h-12 rounded-xl font-semibold border-border">
                        <svg viewBox="0 0 384 512" className="w-5 h-5 mr-2" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                        Apple
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 flex justify-center border-t border-border">
                <p className="text-sm text-muted-foreground font-medium">
                    Pas encore de compte ?{' '}
                    <Link href="/auth/register" className="text-primary font-bold hover:underline">
                        S'inscrire
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
