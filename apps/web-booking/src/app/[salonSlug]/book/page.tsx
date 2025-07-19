import { notFound } from 'next/navigation'
import Link from 'next/link'

interface BookingPageProps {
  params: {
    salonSlug: string
  }
  searchParams: {
    lang?: string
  }
}

// Mock function - will be replaced with actual API call
async function getSalonInfo(slug: string) {
  if (slug === 'demo-salon') {
    return {
      id: 'salon_demo',
      slug: 'demo-salon',
      displayName: 'Demo Beauty Salon',
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk', 'ru']
    }
  }
  return null
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const salon = await getSalonInfo(params.salonSlug)
  
  if (!salon) {
    notFound()
  }

  const locale = searchParams.lang || salon.primaryLocale

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${salon.slug}?lang=${locale}`} className="text-purple-600 hover:text-purple-700">
            ← {locale === 'pl' ? 'Powrót' : 
               locale === 'en' ? 'Back' :
               locale === 'uk' ? 'Назад' :
               'Назад'}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {locale === 'pl' ? 'Rezerwacja' : 
             locale === 'en' ? 'Booking' :
             locale === 'uk' ? 'Бронювання' :
             'Бронирование'}
          </h1>
          <div></div>
        </div>
      </header>

      {/* Booking Process Placeholder */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            {locale === 'pl' ? 'Umów wizytę' : 
             locale === 'en' ? 'Book Appointment' :
             locale === 'uk' ? 'Записатися на прийом' :
             'Записаться на прием'}
          </h2>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <span className="ml-2 text-sm text-gray-600">
                  {locale === 'pl' ? 'Usługi' : 'Services'}
                </span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <span className="ml-2 text-sm text-gray-500">
                  {locale === 'pl' ? 'Termin' : 'Date & Time'}
                </span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                <span className="ml-2 text-sm text-gray-500">
                  {locale === 'pl' ? 'Dane' : 'Details'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 2 Components Placeholder */}
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                🚧 Stage 2 Components Coming Next
              </h3>
              <p className="text-yellow-700">
                ServiceList, StaffList, CalendarSlots, and BookingForm components 
                will be implemented in the next stage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">📋 ServiceList Component</h4>
                <p className="text-sm text-gray-600">Category-grouped services with pricing</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">👥 StaffList Component</h4>
                <p className="text-sm text-gray-600">Master selection with language indicators</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">📅 CalendarSlots Component</h4>
                <p className="text-sm text-gray-600">Date picker with available time slots</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">📝 BookingForm Component</h4>
                <p className="text-sm text-gray-600">Client details and confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params, searchParams }: BookingPageProps) {
  const salon = await getSalonInfo(params.salonSlug)
  const locale = searchParams.lang || salon?.primaryLocale || 'pl'
  
  if (!salon) {
    return {
      title: 'Booking Not Found'
    }
  }

  return {
    title: `${locale === 'pl' ? 'Rezerwacja' : 'Booking'} - ${salon.displayName}`,
    description: locale === 'pl' ? 
      'Zarezerwuj wizytę online w kilku prostych krokach.' :
      'Book your appointment online in a few simple steps.'
  }
}
