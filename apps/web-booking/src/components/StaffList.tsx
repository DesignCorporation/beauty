'use client';

import { StaffListProps, SUPPORTED_LANGUAGES } from '@/lib/types';
import { User, Star } from 'lucide-react';

export default function StaffList({ 
  staff, 
  locale, 
  clientLanguage,
  onStaffSelect,
  selectedStaffId,
  showLanguageWarning = false
}: StaffListProps) {
  const getLocalizedText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      ourTeam: {
        pl: 'Nasz zespół',
        en: 'Our team',
        uk: 'Наша команда',
        ru: 'Наша команда'
      },
      languageWarning: {
        pl: 'Wybrany specjalista nie mówi w Twoim języku. Zapewnimy tłumaczenie.',
        en: 'Selected master does not speak your language. We will provide translation.',
        uk: 'Обраний майстер не розмовляє вашою мовою. Ми забезпечимо переклад.',
        ru: 'Выбранный мастер не говорит на вашем языке. Мы обеспечим перевод.'
      },
      translationNeeded: {
        pl: 'Potrzebny tłumacz',
        en: 'Translation needed',
        uk: 'Потрібен переклад',
        ru: 'Нужен переводчик'
      },
      speaksYourLanguage: {
        pl: 'Mówi w Twoim języku',
        en: 'Speaks your language',
        uk: 'Розмовляє вашою мовою',
        ru: 'Говорит на вашем языке'
      },
      selectMaster: {
        pl: 'Wybierz specjalistę',
        en: 'Select master',
        uk: 'Оберіть майстра',
        ru: 'Выберите мастера'
      },
      anyMaster: {
        pl: 'Dowolny specjalista',
        en: 'Any available master',
        uk: 'Будь-який майстер',
        ru: 'Любой мастер'
      },
      roles: {
        pl: {
          MASTER: 'Specjalista',
          ADMIN: 'Administrator',
          RECEPTION: 'Recepcja',
          OTHER: 'Inne'
        },
        en: {
          MASTER: 'Master',
          ADMIN: 'Administrator', 
          RECEPTION: 'Reception',
          OTHER: 'Other'
        },
        uk: {
          MASTER: 'Майстер',
          ADMIN: 'Адміністратор',
          RECEPTION: 'Рецепція',
          OTHER: 'Інше'
        },
        ru: {
          MASTER: 'Мастер',
          ADMIN: 'Администратор',
          RECEPTION: 'Ресепшн',
          OTHER: 'Другое'
        }
      }
    };
    return texts[key]?.[locale] || texts[key]?.['en'] || texts[key]?.['pl'] || key;
  };

  const getRoleText = (role: string) => {
    const roles = getLocalizedText('roles') as any;
    return roles[role] || role;
  };

  const activeMasters = staff.filter(s => s.active && s.role === 'MASTER');

  const doesMasterSpeakClientLanguage = (masterLocales: string[]) => {
    if (!clientLanguage) return true;
    return masterLocales.includes(clientLanguage);
  };

  if (activeMasters.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">{getLocalizedText('ourTeam')}</h2>
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-600">
              {locale === 'pl' ? 'Brak dostępnych specjalistów' : 
               locale === 'en' ? 'No masters available' :
               locale === 'uk' ? 'Немає доступних майстрів' :
               'Нет доступных мастеров'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          {getLocalizedText('ourTeam')}
        </h2>

        {/* Language warning */}
        {showLanguageWarning && clientLanguage && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-amber-800 text-sm font-medium">
                {getLocalizedText('languageWarning')}
              </p>
            </div>
          </div>
        )}

        {/* Any master option */}
        <div className="mb-8">
          <div
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedStaffId === undefined
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-primary-300'
            }`}
            onClick={() => onStaffSelect?.(undefined as any)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <Star className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getLocalizedText('anyMaster')}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === 'pl' ? 'System automatycznie przydzieli najlepszego dostępnego specjalistę' :
                   locale === 'en' ? 'System will automatically assign the best available master' :
                   locale === 'uk' ? 'Система автоматично призначить найкращого доступного майстра' :
                   'Система автоматически назначит лучшего доступного мастера'}
                </p>
              </div>
              {selectedStaffId === undefined && (
                <div className="ml-auto">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Masters grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeMasters.map((member) => {
            const speaksClientLang = doesMasterSpeakClientLanguage(member.spokenLocales);
            const isSelected = selectedStaffId === member.id;

            return (
              <div
                key={member.id}
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
                onClick={() => onStaffSelect?.(member)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Master info */}
                <div className="flex items-center mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4 flex-shrink-0"
                    style={{ backgroundColor: member.color || '#667eea' }}
                  >
                    <User className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getRoleText(member.role)}
                    </p>
                  </div>
                </div>

                {/* Language indicators */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                      {locale === 'pl' ? 'Języki' : 
                       locale === 'en' ? 'Languages' :
                       locale === 'uk' ? 'Мови' :
                       'Языки'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.spokenLocales.map(lang => {
                        const language = SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES];
                        const isClientLang = lang === clientLanguage;
                        
                        return (
                          <span 
                            key={lang} 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isClientLang
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            <span className="mr-1">{language?.flag || '🏳️'}</span>
                            {language?.name || lang.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language compatibility status */}
                  {clientLanguage && (
                    <div className={`flex items-center space-x-2 text-xs ${
                      speaksClientLang ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        speaksClientLang ? 'bg-green-500' : 'bg-amber-500'
                      }`}></div>
                      <span className="font-medium">
                        {speaksClientLang 
                          ? getLocalizedText('speaksYourLanguage')
                          : getLocalizedText('translationNeeded')
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                  isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-5 bg-primary-600'
                }`} />
              </div>
            );
          })}
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {locale === 'pl' ? 'Możesz wybrać preferowanego specjalistę lub pozwolić systemowi na automatyczny wybór' :
             locale === 'en' ? 'You can choose your preferred master or let the system automatically select' :
             locale === 'uk' ? 'Ви можете обрати бажаного майстра або дозволити системі автоматично вибрати' :
             'Вы можете выбрать предпочитаемого мастера или позволить системе автоматически выбрать'}
          </p>
        </div>
      </div>
    </section>
  );
}
