'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Scan, Search, Flame, Scan, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';

const CATEGORIES = [
    { name: 'Gluten Free', icon: '🌾', color: 'bg-orange-100 text-orange-700', count: '12k' },
    { name: 'Vegan', icon: '🌱', color: 'bg-green-100 text-green-700', count: '45k' },
    { name: 'Halal', icon: '☪️', color: 'bg-blue-100 text-blue-700', count: '30k' },
    { name: 'Kosher', icon: '✡️', color: 'bg-indigo-100 text-indigo-700', count: '28k' },
    { name: 'High Protein', icon: '💪', color: 'bg-red-100 text-red-700', count: '89k' },
    { name: 'Low Sugar', icon: '🍬', color: 'bg-teal-100 text-teal-700', count: '15k' },
    { name: 'Kids', icon: '🧸', color: 'bg-pink-100 text-pink-700', count: '6k' },
    { name: 'Budget', icon: '💰', color: 'bg-yellow-100 text-yellow-700', count: '11k' },
    { name: 'Healthy', icon: '💚', color: 'bg-emerald-100 text-emerald-700', count: '150k' },
    { name: 'Trending', icon: '🔥', color: 'bg-purple-100 text-purple-700', count: 'Top 50' },
];

const TRENDING_PRODUCTS = [
    { id: '1', name: 'Yaourt Skyr', brand: 'Danone', score: 92, image: '🍦', category: 'High Protein' },
    { id: '2', name: 'Pain Complet', brand: 'Harrys', score: 85, image: '🍞', category: 'Healthy' },
    { id: '3', name: 'Jus d\'Orange', brand: 'Tropicana', score: 45, image: '🍊', category: 'High Sugar' },
];

export default function HomePage() {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { user } = useUserStore();

    return (
        <div className="flex flex-col min-h-screen bg-background pb-8">
            <Header />

            <main className="flex-1 px-4 space-y-8 mt-2">
                {/* Search Section */}
                <section>
                    <motion.div
                        animate={{ scale: isSearchFocused ? 1.02 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative"
                    >
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className={`w-5 h-5 ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
                        </div>
                        <Input
                            type="text"
                            placeholder="Rechercher un produit, une marque..."
                            className="pl-10 h-14 rounded-2xl bg-card border-border shadow-sm text-base focus-visible:ring-primary focus-visible:border-primary transition-all"
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                    </motion.div>
                </section>

                {/* Categories Grid (Horizontal Scroll - 2 Rows) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground">Explorer par besoin</h2>
                        <Link href="/app/categories" className="text-sm font-semibold text-primary flex items-center">
                            Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 custom-scrollbar">
                        <div className="grid grid-rows-2 grid-flow-col gap-3 w-max">
                            {CATEGORIES.map((cat) => (
                                <motion.div
                                    key={cat.name}
                                    whileTap={{ scale: 0.95 }}
                                    className={`${cat.color} w-40 p-3 rounded-2xl flex items-center space-x-3 cursor-pointer shadow-sm border border-black/5 hover:opacity-90 transition-opacity`}
                                >
                                    <div className="text-2xl bg-white/50 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                                        {cat.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm leading-tight text-current">{cat.name}</span>
                                        <span className="text-[10px] font-medium opacity-80">{cat.count} produits</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trending Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Flame className="text-warning w-5 h-5" />
                            Tendances de la semaine
                        </h2>
                    </div>
                    <div className="flex flex-col gap-4">
                        {TRENDING_PRODUCTS.map((product) => (
                            <Card key={product.id} className="overflow-hidden border-border shadow-sm rounded-2xl border-transparent hover:border-primary/20 transition-all cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center text-3xl shadow-inner border border-border">
                                        {product.image}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight">{product.name}</h3>
                                                <p className="text-xs text-muted-foreground font-medium">{product.brand}</p>
                                            </div>
                                            <Badge variant="outline" className={`font-extrabold ${product.score > 80 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warning/10 text-warning border-warning/20'} px-2 py-1 rounded-lg`}>
                                                {product.score} NSS
                                            </Badge>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* User History (If logged in) */}
                {user && (
                    <section className="pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-foreground">Derniers scans</h2>
                            <Link href="/app/profil" className="text-sm font-semibold text-primary">
                                Historique
                            </Link>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center">
                            <Scan className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                            <p className="text-sm font-medium text-muted-foreground">Aucun scan récent aujourd'hui.</p>
                            <Link href="/app/scan">
                                <button className="mt-4 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl transition-colors hover:bg-primary/20">
                                    Scanner un produit
                                </button>
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

