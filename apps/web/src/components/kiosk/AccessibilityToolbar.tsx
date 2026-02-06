"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings2,
    ZoomIn,
    ZoomOut,
    Contrast,
    Eye,
    RotateCcw,
    X,
    Accessibility,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/lib/context/accessibility';

export function AccessibilityToolbar() {
    const { i18n } = useTranslation();
    const isHindi = i18n.language === 'hi';
    const [isOpen, setIsOpen] = useState(false);

    const {
        settings,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        setReducedMotion,
        resetSettings,
    } = useAccessibility();

    const fontSizeLabels = {
        normal: isHindi ? 'सामान्य' : 'Normal',
        large: isHindi ? 'बड़ा' : 'Large',
        'extra-large': isHindi ? 'बहुत बड़ा' : 'Extra Large',
    };

    return (
        <>
            {/* Accessibility Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
                title={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
            >
                <Accessibility className="w-6 h-6" />
            </button>

            {/* Accessibility Panel */}
            {isOpen && (
                <div className="fixed bottom-20 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5" />
                            <h3 className="font-medium">
                                {isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility'}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-1 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Settings */}
                    <div className="p-4 space-y-4">
                        {/* Font Size */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {isHindi ? 'फ़ॉन्ट आकार' : 'Font Size'}
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={decreaseFontSize}
                                    disabled={settings.fontSize === 'normal'}
                                    className="flex-1"
                                >
                                    <ZoomOut className="w-4 h-4 mr-1" />
                                    {isHindi ? 'छोटा' : 'Smaller'}
                                </Button>
                                <span className="px-3 py-1 bg-slate-100 rounded text-sm font-medium min-w-[80px] text-center">
                                    {fontSizeLabels[settings.fontSize]}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={increaseFontSize}
                                    disabled={settings.fontSize === 'extra-large'}
                                    className="flex-1"
                                >
                                    <ZoomIn className="w-4 h-4 mr-1" />
                                    {isHindi ? 'बड़ा' : 'Larger'}
                                </Button>
                            </div>
                        </div>

                        {/* High Contrast */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Contrast className="w-4 h-4" />
                                {isHindi ? 'उच्च कंट्रास्ट' : 'High Contrast'}
                            </label>
                            <Button
                                variant={settings.contrastMode === 'high' ? 'default' : 'outline'}
                                size="sm"
                                onClick={toggleHighContrast}
                                className="w-full"
                            >
                                {settings.contrastMode === 'high' ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Reduced Motion */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                {isHindi ? 'कम एनिमेशन' : 'Reduce Motion'}
                            </label>
                            <Button
                                variant={settings.reducedMotion ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setReducedMotion(!settings.reducedMotion)}
                                className="w-full"
                            >
                                {settings.reducedMotion ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Reset */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetSettings}
                            className="w-full text-slate-500"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {isHindi ? 'रीसेट करें' : 'Reset to Default'}
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 text-center border-t">
                        {isHindi
                            ? 'सभी उपयोगकर्ताओं के लिए सुलभता'
                            : 'Accessibility for all users'}
                    </div>
                </div>
            )}
        </>
    );
}
