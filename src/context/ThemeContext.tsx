'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ThemeConfig {
  id: string;
  name: string;
  primaryFrom: string;
  primaryTo: string;
  accent: string;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCTA: string;
  heroCTAHref: string;
}

export const PRESET_THEMES: Record<string, ThemeConfig & { label: string; preview: [string, string] }> = {
  'rose-purple': {
    id: 'rose-purple', name: 'rose-purple', label: 'Rose & Purple',
    primaryFrom: '#e11d48', primaryTo: '#9333ea', accent: '#f43f5e',
    preview: ['#e11d48', '#9333ea'],
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80',
    heroTitle: 'Crafted for Her Story',
    heroSubtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    heroCTA: 'Explore Collections', heroCTAHref: '/collections',
  },
  'blue-ocean': {
    id: 'blue-ocean', name: 'blue-ocean', label: 'Blue Ocean',
    primaryFrom: '#2563eb', primaryTo: '#06b6d4', accent: '#3b82f6',
    preview: ['#2563eb', '#06b6d4'],
    heroImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80',
    heroTitle: 'Crafted for Her Story',
    heroSubtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    heroCTA: 'Explore Collections', heroCTAHref: '/collections',
  },
  'emerald-gold': {
    id: 'emerald-gold', name: 'emerald-gold', label: 'Emerald & Gold',
    primaryFrom: '#059669', primaryTo: '#d97706', accent: '#10b981',
    preview: ['#059669', '#d97706'],
    heroImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200&q=80',
    heroTitle: 'Crafted for Her Story',
    heroSubtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    heroCTA: 'Explore Collections', heroCTAHref: '/collections',
  },
  'sunset': {
    id: 'sunset', name: 'sunset', label: 'Sunset Glow',
    primaryFrom: '#f97316', primaryTo: '#ec4899', accent: '#fb923c',
    preview: ['#f97316', '#ec4899'],
    heroImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
    heroTitle: 'Crafted for Her Story',
    heroSubtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    heroCTA: 'Explore Collections', heroCTAHref: '/collections',
  },
  'midnight': {
    id: 'midnight', name: 'midnight', label: 'Midnight Luxury',
    primaryFrom: '#1e3a8a', primaryTo: '#7c3aed', accent: '#3b82f6',
    preview: ['#1e3a8a', '#7c3aed'],
    heroImage: 'https://images.unsplash.com/photo-1594938298603-4b5c9be11c3f?w=1200&q=80',
    heroTitle: 'Crafted for Her Story',
    heroSubtitle: 'Bespoke tailoring that celebrates every woman — from traditional elegance to modern chic',
    heroCTA: 'Explore Collections', heroCTAHref: '/collections',
  },
};

const DEFAULT_THEME = PRESET_THEMES['rose-purple'];

interface ThemeContextType {
  theme: ThemeConfig;
  themeLoading: boolean;
  updateTheme: (config: Partial<ThemeConfig>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  themeLoading: false,
  updateTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [themeLoading, setThemeLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'siteSettings', 'theme'))
      .then(snap => { if (snap.exists()) setTheme(snap.data() as ThemeConfig); })
      .catch(e => console.error('Theme load error:', e))
      .finally(() => setThemeLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-from', theme.primaryFrom);
    document.documentElement.style.setProperty('--theme-to', theme.primaryTo);
    document.documentElement.style.setProperty('--theme-accent', theme.accent);
  }, [theme]);

  const updateTheme = async (config: Partial<ThemeConfig>) => {
    const updated = { ...theme, ...config };
    await setDoc(doc(db, 'siteSettings', 'theme'), updated);
    setTheme(updated);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeLoading, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
