'use client';

import { ServiceListProps, SERVICE_CATEGORIES, ServiceCategory } from '@/lib/types';
import { Clock, Check } from 'lucide-react';
import { useState } from 'react';

export default function ServiceList({ 
  services, 
  locale, 
  onServiceSelect,
  selectedServices = [],
  showPrices = true,
  groupByCategory = true
}: ServiceListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getLocalizedText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      ourServices: {
        pl: 'Nasze usługi',
        en: 'Our services',
        uk: 'Наші послуги',
        ru: 'Наши услуги'
      },
      allCategories: {
        pl: 'Wszystkie kategorie',
        en: 'All categories',
        uk: 'Всі категорії',
        ru: 'Все категории'
      },
      selectService: {
        pl: 'Wybierz usługę',
        en: 'Select service',
        uk: 'Оберіть послугу',
        ru: 'Выберите услугу'
      },
      selected: {
        pl: 'Wybrano',
        en: 'Selected',
        uk: 'Обрано',
        ru: 'Выбрано'
      },
      minutes: {
        pl: 'min',
        en: 'min',
        uk: 'хв',
        ru: 'мин'
      }
    };
    return texts[key]?.[locale] || texts[key]?.['en'] || texts[key]?.['pl'] || key;
  };

  const getCategoryName = (category: string): string => {
    const categoryKey = category as ServiceCategory;
    return SERVICE_CATEGORIES[categoryKey]?.[locale as keyof typeof SERVICE_CATEGORIES[CategoryKey]] || 
           SERVICE_CATEGORIES[categoryKey]?.['en'] || 
           SERVICE_CATEGORIES[categoryKey]?.['pl'] || 
           category;
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!service.active) return acc;
    
    const category = service.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  // Get unique categories
  const categories = Object.keys(groupedServices).sort();

  // Filter services based on selected category
  const filteredServices = selectedCategory 
    ? groupedServices[selectedCategory] || []
    : services.filter(s => s.active);

  const isServiceSelected = (serviceId: string) => selectedServices.includes(serviceId);

  if (services.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">{getLocalizedText('ourServices')}</h2>
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-600">
              {locale === 'pl' ? 'Brak dostępnych usług' : 
               locale === 'en' ? 'No services available' :
               locale === 'uk' ? 'Немає доступних послуг' :
               'Нет доступных услуг'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          {getLocalizedText('ourServices')}
        </h2>

        {/* Category filter */}
        {groupByCategory && categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {getLocalizedText('allCategories')}
              </button>
              
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {getCategoryName(category)} ({groupedServices[category]?.length || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services display */}
        {groupByCategory && !selectedCategory ? (
          // Show all categories with their services
          categories.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                {getCategoryName(category)}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedServices[category]?.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={isServiceSelected(service.id)}
                    onSelect={() => onServiceSelect?.(service)}
                    showPrice={showPrices}
                    locale={locale}
                    getLocalizedText={getLocalizedText}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Show filtered services in grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={isServiceSelected(service.id)}
                onSelect={() => onServiceSelect?.(service)}
                showPrice={showPrices}
                locale={locale}
                getLocalizedText={getLocalizedText}
              />
            ))}
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {locale === 'pl' ? 'Brak usług w tej kategorii' : 
               locale === 'en' ? 'No services in this category' :
               locale === 'uk' ? 'Немає послуг у цій категорії' :
               'Нет услуг в этой категории'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Service Card Component
interface ServiceCardProps {
  service: any;
  isSelected: boolean;
  onSelect: () => void;
  showPrice: boolean;
  locale: string;
  getLocalizedText: (key: string) => string;
}

function ServiceCard({ 
  service, 
  isSelected, 
  onSelect, 
  showPrice, 
  locale, 
  getLocalizedText 
}: ServiceCardProps) {
  return (
    <div
      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
        isSelected 
          ? 'border-primary-500 bg-primary-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-primary-300'
      }`}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Service info */}
      <div className="pr-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
          {service.name}
        </h4>
        
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {service.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {service.durationMin} {getLocalizedText('minutes')}
            </span>
          </div>
          
          {showPrice && (
            <div className="flex items-center space-x-1 font-semibold text-primary-600">
              <span className="text-lg">{service.priceAmount}</span>
              <span className="text-sm">{service.priceCurrency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
        isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-5 bg-primary-600'
      }`} />
    </div>
  );
}
