import {DEFAULT_LOCALE, type Locale, type TranslationKey, translations} from '@/lib/i18n/translations.ts';
import {createContext, type ReactNode, useContext, useEffect, useMemo, useState} from 'react';

type TranslateVars = Record<string, string | number>;

type LanguageContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, vars?: TranslateVars) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, vars?: TranslateVars): string {
    if (!vars) return template;
    return template.replace(/\{\{(\w+)}}/g, (match, name) => (
        name in vars ? String(vars[name]) : match
    ));
}

export function LanguageProvider({children}: {children: ReactNode}) {
    const [locale, setLocale] = useState<Locale>(() => {
        const stored = localStorage.getItem('locale');
        return stored === 'de' || stored === 'en' ? stored : DEFAULT_LOCALE;
    });

    useEffect(() => {
        localStorage.setItem('locale', locale);
        document.documentElement.lang = locale;
    }, [locale]);

    const value = useMemo<LanguageContextValue>(() => ({
        locale,
        setLocale,
        t: (key, vars) => {
            const template = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;
            return interpolate(template, vars);
        },
    }), [locale]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
    return context;
}
