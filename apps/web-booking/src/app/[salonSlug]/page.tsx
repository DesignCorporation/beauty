import { notFound } from 'next/navigation'

interface SalonPageProps {
  params: {
    salonSlug: string
  }
  searchParams: {
    lang?: string
  }
}

// Mock function - will be replaced with actual API call
async function getSalonInfo(slug: string) {
  // TODO: Integrate with TP-07 Booking API
  if (slug === 'demo-salon') {
    return {
      id: 'salon_demo',
      slug: 'demo-salon',
      displayName: 'Demo Beauty Salon',
      phone: '+48 123 456 789',
      email: 'contact@demo-salon.pl',
      address: {
        street: 'ul. Piękna 123',
        city: 'Warsaw',
        country: 'Poland'
      },
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk', 'ru']
    }
  }
  return null
}

export default async function SalonPage({ params, searchParams }: SalonPageProps) {
  const salon = await getSalonInfo(params.salonSlug)
  
  if (!salon) {
    notFound()
  }

  const locale = searchParams.lang || salon.primaryLocale

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{salon.displayName}</h1>
        </div>
      </header>

      {/* Hero Section Placeholder */}
      <section className="gradient-primary text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold mb-6">{salon.displayName}</h2>
          <p className="text-xl mb-8">
            {locale === 'pl' ? 'Profesjonalne usługi kosmetyczne' : 
             locale === 'en' ? 'Professional beauty services' :
             locale === 'uk' ? 'Професійні косметичні послуги' :
             'Профессиональные косметические услуги'}
          </p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
            {locale === 'pl' ? 'Umów wizytę online' : 
             locale === 'en' ? 'Book appointment online' :
             locale === 'uk' ? 'Записатися онлайн' :
             'Записаться онлайн'}
          </button>
        </div>
      </section>

      {/* Content sections will be added in Stage 2 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              TP-09 Stage 1 Complete ✅
            </h3>
            <p className="text-blue-700">
              Next.js 14 setup ready. Stage 2 will add Hero, ServiceList, StaffList, 
              CalendarSlots, BookingForm, and ChatWidget components.
            </p>
            <div className="mt-4 text-sm text-blue-600">
              <p>Salon: {salon.slug} | Locale: {locale}</p>
              <p>Supported languages: {salon.supportedLocales.join(', ')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export async function generateMetadata({ params, searchParams }: SalonPageProps) {
  const salon = await getSalonInfo(params.salonSlug)
  const locale = searchParams.lang || salon?.primaryLocale || 'pl'
  
  if (!salon) {
    return {
      title: 'Salon Not Found'
    }
  }

  return {
    title: `${salon.displayName} - ${locale === 'pl' ? 'Umów wizytę online' : 'Book Online'}`,
    description: locale === 'pl' ? 
      'Profesjonalne usługi kosmetyczne. Umów wizytę online.' :
      'Professional beauty services. Book your appointment online.'
  }
}
