import React, { createContext, useState, useContext, useEffect } from 'react';
import en from './translations/en.json';
import hi from './translations/hi.json';

const translations: any = {
    en,
    hi
};

type Language = 'en' | 'hi';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string, replacements?: { [key: string]: string | number }) => {
        const keys = key.split('.');
        let translation = translations[language];
        for (const k of keys) {
            if (translation) {
                translation = translation[k];
            } else {
                break;
            }
        }

        if (!translation) {
            return key; // Return the key if translation is not found
        }

        if (replacements) {
            return Object.keys(replacements).reduce((acc, key) => {
                return acc.replace(`{{${key}}}`, String(replacements[key]));
            }, translation);
        }

        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};