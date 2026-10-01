'use client';

import React from 'react';
import { useUserStore } from '@/lib/store/userStore';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
    feature?: string;
    children: React.ReactNode;
}

export default function PremiumGate({ feature = 'cette fonctionnalité', children }: PremiumGateProps) {
    const { isPremium } = useUserStore();

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-xl">
            {/* Blurred background content */}
            <div className="blur-[6px] opacity-70 select-none pointer-events-none transition-all">
                {children}
            </div>

            {/* Overlay with CTA */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/40 backdrop-blur-[2px]">
                <div className="bg-card w-full max-w-[280px] p-5 rounded-2xl shadow-nutriscan border border-border flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-1">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground font-jakarta">Profil Premium Requis</h3>
                    <p className="text-sm text-muted-foreground">
                        Débloquez {feature} avec NutriScan Premium pour aller plus loin.
                    </p>
                    <Link href="/app/premium" className="w-full">
                        <button className="w-full mt-2 bg-gradient-to-r from-warning to-orange-400 text-white font-semibold py-2.5 px-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0">
                            Voir les plans
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
