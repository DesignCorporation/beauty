'use client';

import { useState, useEffect, useRef } from 'react';
import { LanguageSwitcherProps, SUPPORTED_LANGUAGES } from '@/lib/types';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher({ 
  currentLocale, 
  availableLocales, 
  onLanguageChange,
  className = ''
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const currentLang = SUPPORTED_LANGUAGES[currentLocale as keyof typeof SUPPORTED_LANGUAGES];
  const availableLangs = availableLocales
    .map(code => SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES])
    .filter(Boolean);

  const handleLanguageSelect = (langCode: string) => {
    onLanguageChange(langCode);
    setIsOpen(false);
    
    // Store selection in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('beauty-platform-locale', langCode);
    }
  };

  // Load saved language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('beauty-platform-locale');
      if (savedLocale && availableLocales.includes(savedLocale) && savedLocale !== currentLocale) {
        onLanguageChange(savedLocale);
      }
    }
  }, [availableLocales, currentLocale, onLanguageChange]);

  if (availableLangs.length <= 1) {
    // Don't show switcher if only one language available
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang?.flag} {currentLang?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-full z-50 overflow-hidden">
            <div className="py-1">
              {availableLangs.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 ${
                    lang.code === currentLocale 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lang.name}</span>
                    <span className="text-xs text-gray-500">{lang.nativeName}</span>
                  </div>
                  {lang.code === currentLocale && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
