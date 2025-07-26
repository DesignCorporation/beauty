import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { PlatformFeatures } from './components/PlatformFeatures'
import { HowItWorks } from './components/HowItWorks'
import { Testimonials } from './components/Testimonials'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <Hero />
      <Features />
      <PlatformFeatures />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
