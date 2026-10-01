import { create } from 'zustand';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
    country: string;
    language: string;
    health_goal?: string | null;
    diet_filters: string[];
    allergies: string[];
}

export interface Subscription {
    id: string;
    plan: 'free' | 'premium_monthly' | 'premium_yearly' | 'b2b';
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
    current_period_end: string;
}

export interface UserStore {
    user: User | null;
    subscription: Subscription | null;
    isPremium: boolean;
    scanCountToday: number;
    setUser: (user: User | null) => void;
    setSubscription: (sub: Subscription | null) => void;
    incrementScanCount: () => void;
    resetScanCount: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    subscription: null,
    isPremium: false,
    scanCountToday: 0,

    setUser: (user) => set({ user }),

    setSubscription: (sub) => set({
        subscription: sub,
        // Is premium if subscription exists and is in a valid paid state
        isPremium: sub?.status === 'active' || sub?.status === 'trialing'
    }),

    incrementScanCount: () => set((state) => ({
        scanCountToday: state.scanCountToday + 1
    })),

    resetScanCount: () => set({ scanCountToday: 0 }),
}));
