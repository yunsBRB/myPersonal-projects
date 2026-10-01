'use client';

import Link from 'next/link';
import { Home, ScanLine, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Accueil', href: '/app' },
        { icon: ScanLine, label: 'Scan', href: '/app/scan', isFab: true },
        { icon: User, label: 'Profil', href: '/app/profil' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isFab) {
                        return (
                            <div key={item.href} className="relative -top-6">
                                <Link href={item.href}>
                                    <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-nutriscan transition-transform active:scale-95 ${isActive ? 'animate-pulse' : ''}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 transition-colors">
                            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
