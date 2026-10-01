'use client';

import { Bell } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function Header() {
    const { user } = useUserStore();

    return (
        <header className="flex items-center justify-between px-4 py-4 bg-background sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    N
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-foreground tracking-tight">NutriScan</h1>
                    <p className="text-xs text-muted-foreground font-medium -mt-1">
                        {user ? `Bonjour, ${user.name}` : 'Bienvenue'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative text-foreground hover:text-primary transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-warning rounded-full border border-background"></span>
                </button>
                <Link href="/app/profil">
                    <Avatar className="w-10 h-10 border-2 border-border">
                        <AvatarImage src={user?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
