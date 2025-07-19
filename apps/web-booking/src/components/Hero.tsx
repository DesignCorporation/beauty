'use client';

import { HeroProps } from '@/lib/types';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';

export default function Hero({ salon, locale, onBookingClick }: HeroProps) {
  const getLocalizedText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      heroSubtitle: {
        pl: 'Profesjonalne usługi kosmetyczne',
        en: 'Professional beauty services',
        uk: 'Професійні косметичні послуги',
        ru: 'Профессиональные косметические услуги'
      },
      bookingButton: {
        pl: 'Umów wizytę online',
        en: 'Book appointment online',
        uk: 'Записатися онлайн',
        ru: 'Записаться онлайн'
      },
      workingHours: {
        pl: 'Godziny otwarcia',
        en: 'Working hours',
        uk: 'Години роботи',
        ru: 'Часы работы'
      },
      contact: {
        pl: 'Kontakt',
        en: 'Contact',
        uk: 'Контакт',
        ru: 'Контакт'
      }
    };
    return texts[key]?.[locale] || texts[key]?.['en'] || texts[key]?.['pl'] || key;
  };

  // Mock working hours - will be replaced with real data from API
  const workingHours = {
    pl: 'Pon-Pt: 9:00-19:00, Sob: 9:00-16:00',
    en: 'Mon-Fri: 9:00-19:00, Sat: 9:00-16:00',
    uk: 'Пн-Пт: 9:00-19:00, Сб: 9:00-16:00',
    ru: 'Пн-Пт: 9:00-19:00, Сб: 9:00-16:00'
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-primary opacity-95" />
      
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        {/* Main heading */}
        <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
          {salon.displayName}
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-3xl mb-12 opacity-90 font-light">
          {getLocalizedText('heroSubtitle')}
        </p>

        {/* Contact grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
          {/* Address */}
          {salon.address && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm opacity-75 mb-1">Adres</p>
                <p className="font-medium">
                  {salon.address.street && <span className="block">{salon.address.street}</span>}
                  {salon.address.city && <span>{salon.address.city}</span>}
                </p>
              </div>
            </div>
          )}
          
          {/* Phone */}
          {salon.phone && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm opacity-75 mb-1">Telefon</p>
                <a 
                  href={`tel:${salon.phone}`}
                  className="font-medium hover:opacity-75 transition-opacity"
                >
                  {salon.phone}
                </a>
              </div>
            </div>
          )}
          
          {/* Email */}
          {salon.email && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm opacity-75 mb-1">Email</p>
                <a 
                  href={`mailto:${salon.email}`}
                  className="font-medium hover:opacity-75 transition-opacity break-all"
                >
                  {salon.email}
                </a>
              </div>
            </div>
          )}
          
          {/* Working Hours */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm opacity-75 mb-1">{getLocalizedText('workingHours')}</p>
              <p className="font-medium text-sm">
                {workingHours[locale as keyof typeof workingHours] || workingHours.en}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button 
            onClick={onBookingClick}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {getLocalizedText('bookingButton')}
          </button>
          
          {/* WhatsApp button - placeholder */}
          {salon.socialLinks?.whatsapp && (
            <a
              href={`https://wa.me/${salon.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

        {/* Social Links */}
        {salon.socialLinks && (Object.keys(salon.socialLinks).length > 0) && (
          <div className="flex justify-center space-x-6">
            {salon.socialLinks.instagram && (
              <a 
                href={salon.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </a>
            )}
            
            {salon.socialLinks.facebook && (
              <a 
                href={salon.socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </a>
            )}
            
            {salon.socialLinks.telegram && (
              <a 
                href={salon.socialLinks.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 group"
                aria-label="Telegram"
              >
                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </a>
            )}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white border-opacity-50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white bg-opacity-50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-32 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-32 left-40 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-pulse delay-500"></div>
    </section>
  );
}
