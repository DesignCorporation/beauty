import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ServiceList = dynamic(() => import('../components/ServiceList'), {
  loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
})

export default function SalonPage({ params }: { params: { slug: string } }) {
  const isEmbed = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('embed') === '1'

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Optimized for LCP */}
      <section className="relative h-screen bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt="Beauty Salon"
          fill
          priority
          className="object-cover mix-blend-overlay opacity-30"
          sizes="100vw"
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Book Your Beauty
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Professional services at {params.slug} salon
            </p>
            <button className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* Services Section - Lazy Loaded */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg" />}>
            <ServiceList salonSlug={params.slug} />
          </Suspense>
        </div>
      </section>

      {/* Booking Widget Embed Support - Async Loading */}
      {isEmbed && (
        <script
          src="/widget.js"
          async
          data-salon={params.slug}
        />
      )}
    </div>
  )
}
