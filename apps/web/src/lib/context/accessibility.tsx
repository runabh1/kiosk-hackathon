"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSize = 'normal' | 'large' | 'extra-large';
type ContrastMode = 'normal' | 'high';

interface AccessibilitySettings {
    fontSize: FontSize;
    contrastMode: ContrastMode;
    reducedMotion: boolean;
}

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    setFontSize: (size: FontSize) => void;
    setContrastMode: (mode: ContrastMode) => void;
    setReducedMotion: (reduced: boolean) => void;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    toggleHighContrast: () => void;
    resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
    fontSize: 'normal',
    contrastMode: 'normal',
    reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'suvidha_accessibility';

const fontSizeClasses: Record<FontSize, string> = {
    'normal': '',
    'large': 'text-lg',
    'extra-large': 'text-xl',
};

const fontSizeScale: Record<FontSize, string> = {
    'normal': '1',
    'large': '1.15',
    'extra-large': '1.3',
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
    const [mounted, setMounted] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings(JSON.parse(stored));
            }

            // Check for prefers-reduced-motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                setSettings(prev => ({ ...prev, reducedMotion: true }));
            }
        } catch (e) {
            console.error('Failed to load accessibility settings:', e);
        }
    }, []);

    // Save settings to localStorage and apply to document
    useEffect(() => {
        if (!mounted) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save accessibility settings:', e);
        }

        // Apply font size to document
        document.documentElement.style.setProperty('--accessibility-font-scale', fontSizeScale[settings.fontSize]);

        // Apply high contrast mode
        if (settings.contrastMode === 'high') {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }

        // Apply reduced motion
        if (settings.reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }, [settings, mounted]);

    const setFontSize = (size: FontSize) => {
        setSettings(prev => ({ ...prev, fontSize: size }));
    };

    const setContrastMode = (mode: ContrastMode) => {
        setSettings(prev => ({ ...prev, contrastMode: mode }));
    };

    const setReducedMotion = (reduced: boolean) => {
        setSettings(prev => ({ ...prev, reducedMotion: reduced }));
    };

    const increaseFontSize = () => {
        setSettings(prev => ({
            ...prev,
            fontSize: prev.fontSize === 'normal' ? 'large' :
                prev.fontSize === 'large' ? 'extra-large' : 'extra-large',
        }));
    };

    const decreaseFontSize = () => {
        setSettings(prev => ({
            ...prev,
            fontSize: prev.fontSize === 'extra-large' ? 'large' :
                prev.fontSize === 'large' ? 'normal' : 'normal',
        }));
    };

    const toggleHighContrast = () => {
        setSettings(prev => ({
            ...prev,
            contrastMode: prev.contrastMode === 'normal' ? 'high' : 'normal',
        }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                settings,
                setFontSize,
                setContrastMode,
                setReducedMotion,
                increaseFontSize,
                decreaseFontSize,
                toggleHighContrast,
                resetSettings,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}

export { fontSizeClasses, fontSizeScale };
export type { FontSize, ContrastMode, AccessibilitySettings };
