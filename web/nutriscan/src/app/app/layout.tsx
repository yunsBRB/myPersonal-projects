import React from 'react';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            {children}
            <BottomNav />
        </div>
    );
}
