'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import { useUserStore } from '@/lib/store/userStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, ChevronRight, LogOut, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Lun', score: 65 },
    { name: 'Mar', score: 72 },
    { name: 'Mer', score: 68 },
    { name: 'Jeu', score: 85 },
    { name: 'Ven', score: 90 },
    { name: 'Sam', score: 88 },
    { name: 'Dim', score: 92 },
];

export default function ProfilPage() {
    const { user, isPremium } = useUserStore();

    return (
        <div className="min-h-screen bg-background pb-8">
            <Header />

            <main className="px-4 py-6 space-y-6">
                {/* User Card */}
                <Card className="rounded-3xl border-0 bg-gradient-to-br from-[#1A1A2E] to-[#2a2a47] text-white shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary blur-3xl opacity-20 -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/20">
                                👩‍🦰
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-black">{user?.name || 'Visiteur'}</h1>
                                <p className="text-white/70 font-medium text-sm mb-2">{user?.email || 'hello@nutriscan.com'}</p>
                                {isPremium ? (
                                    <Badge className="bg-gradient-to-r from-orange-400 to-warning text-white border-0 font-bold px-3 py-1">Premium Actif</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-white/80 border-white/30 font-bold px-3 py-1">Membre Gratuit</Badge>
                                )}
                            </div>
                        </div>

                        {!isPremium && (
                            <Link href="/app/premium">
                                <button className="w-full mt-6 bg-gradient-to-r from-warning to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <ArrowUpCircle className="w-5 h-5" />
                                    Passer à NutriScan Premium
                                </button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-start gap-1">
                            <span className="text-3xl font-black text-foreground">124</span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scans Total</span>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-start gap-1">
                            <span className="text-3xl font-black text-primary">85</span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score Moyen</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Health Chart */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-3 px-1">Évolution Santé</h2>
                    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                        <CardContent className="p-4 pt-6 h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', borderColor: '#E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#1A7A4A' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#1A7A4A" strokeWidth={4} dot={{ r: 4, fill: '#1A7A4A', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* Settings Menu */}
                <section className="bg-card rounded-2xl shadow-sm border border-border divide-y divide-border overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Settings className="w-5 h-5" /></div>
                            <span className="font-semibold text-foreground">Préférences Alimentaires</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Shield className="w-5 h-5" /></div>
                            <span className="font-semibold text-foreground">Confidentialité & RGPD</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-destructive flex items-center justify-center group-hover:bg-red-200 transition-colors"><LogOut className="w-5 h-5" /></div>
                            <span className="font-semibold text-destructive">Déconnexion</span>
                        </div>
                    </button>
                </section>
            </main>
        </div>
    );
}
