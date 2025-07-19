'use client';

import { Salon } from '@/lib/types';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

interface HeroProps {
  salon: Salon;
  locale: string;
  translations: Record<string, string>;
}

export default function Hero({ salon, locale, translations }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {salon.displayName}
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          {translations['hero.subtitle'] || 'Professional beauty services'}
        </p>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {salon.address && (
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>{salon.address.street}, {salon.address.city}</span>
            </div>
          )}
          
          {salon.phone && (
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>{salon.phone}</span>
            </div>
          )}
          
          {salon.email && (
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>{salon.email}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
          {translations['hero.book_online'] || 'Book appointment online'}
        </button>

        {/* Social Links */}
        {salon.socialLinks && (
          <div className="flex justify-center space-x-4 mt-8">
            {salon.socialLinks.instagram && (
              <a href={salon.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram className="w-6 h-6 hover:opacity-75 transition-opacity" />
              </a>
            )}
            {salon.socialLinks.facebook && (
              <a href={salon.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                <Facebook className="w-6 h-6 hover:opacity-75 transition-opacity" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}