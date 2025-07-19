'use client';

import { useState } from 'react';
import { Language } from '@/lib/types';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale: string;
  availableLocales: string[];
  onLanguageChange: (locale: string) => void;
}

const languages: Record<string, Language> = {
  pl: { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  en: { code: 'en', name: 'English', flag: '🇬🇧' },
  uk: { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  ru: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
};

export default function LanguageSwitcher({ 
  currentLocale, 
  availableLocales, 
  onLanguageChange 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages[currentLocale];
  const availableLangs = availableLocales.map(code => languages[code]).filter(Boolean);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{currentLang?.flag} {currentLang?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-full z-50">
          {availableLangs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left text-sm"
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}