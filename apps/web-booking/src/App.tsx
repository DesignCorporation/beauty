import React from 'react';
import './index.css';

// Import icons
import { Sparkles, Calendar, Heart, Star, Users, MapPin } from 'lucide-react';

// Hero Section Component
const HeroSection: React.FC = () => {
  return (
    <section className="relative section-padding overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-beauty-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-float animation-delay-500"></div>
      </div>
      
      <div className="container-beauty relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-slide-down">
            <Sparkles className="w-4 h-4 text-beauty-600" />
            <span className="text-sm font-medium text-gray-700">Professional Beauty Platform</span>
          </div>
          
          {/* Main headline */}
          <h1 className="heading-xl text-gray-900 mb-6 animate-slide-up">
            Book Your Perfect{' '}
            <span className="text-gradient">Beauty Experience</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-body-lg max-w-2xl mx-auto mb-8 animate-slide-up animate-delay-100">
            Multi-tenant SaaS platform connecting beauty professionals with clients. 
            Advanced booking system with 40+ services across 8 categories.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animate-delay-200">
            <button className="btn-primary btn-lg group">
              <Calendar className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Book Appointment
            </button>
            <button className="btn-secondary btn-lg">
              Learn More
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 animate-slide-up animate-delay-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">40+</div>
              <div className="text-sm text-gray-600">Beauty Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">6</div>
              <div className="text-sm text-gray-600">Currencies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component  
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking System',
      description: 'Real-time availability, automated reminders, and seamless scheduling for beauty professionals.',
      color: 'beauty'
    },
    {
      icon: Users,
      title: 'Multi-tenant Architecture',
      description: 'Secure data isolation with tenant-scoped APIs ensuring complete privacy between salons.',
      color: 'rose'
    },
    {
      icon: Heart,
      title: 'Client Management',
      description: 'Comprehensive CRM with client preferences, history, and personalized service recommendations.',
      color: 'beauty'
    },
    {
      icon: MapPin,
      title: 'Multi-language Support',
      description: 'Native support for Polish, English, Ukrainian, and Russian with auto-translation.',
      color: 'rose'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-beauty">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-gray-900 mb-4">
            Everything You Need for{' '}
            <span className="text-gradient">Beauty Success</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            Built with modern technology stack and designed for scalability, security, and user experience.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`card-hover p-8 group animate-slide-up animate-delay-${index * 100}`}
            >
              <div className={`inline-flex p-3 rounded-2xl mb-4 ${
                feature.color === 'beauty' ? 'bg-beauty-100' : 'bg-rose-100'
              }`}>
                <feature.icon className={`w-6 h-6 ${
                  feature.color === 'beauty' ? 'text-beauty-600' : 'text-rose-600'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-beauty-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-body">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Services Preview Component
const ServicesSection: React.FC = () => {
  const categories = [
    { name: 'Hair', count: '9 services', icon: '💇‍♀️', color: 'bg-beauty-500' },
    { name: 'Nails', count: '6 services', icon: '💅', color: 'bg-rose-500' },
    { name: 'Brows & Lashes', count: '6 services', icon: '👁️', color: 'bg-beauty-500' },
    { name: 'Skincare', count: '5 services', icon: '✨', color: 'bg-rose-500' },
    { name: 'Waxing', count: '5 services', icon: '🌸', color: 'bg-beauty-500' },
    { name: 'Barber', count: '4 services', icon: '💈', color: 'bg-rose-500' },
    { name: 'Spa & Massage', count: '4 services', icon: '🧖‍♀️', color: 'bg-beauty-500' },
    { name: 'Packages', count: '3 combos', icon: '🎁', color: 'bg-rose-500' }
  ];

  return (
    <section className="section-padding bg-gradient-beauty-subtle">
      <div className="container-beauty">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-gray-900 mb-4">
            Complete Service{' '}
            <span className="text-gradient">Library</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            Pre-configured with 40+ professional beauty services across 8 categories, 
            ready to customize for your salon.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`card-hover p-6 text-center group animate-scale-in animate-delay-${index * 100}`}
            >
              <div className={`w-12 h-12 mx-auto mb-4 ${category.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Technical Stack Component
const TechStackSection: React.FC = () => {
  const technologies = [
    { name: 'TypeScript', desc: 'Type-safe development' },
    { name: 'React 18', desc: 'Modern UI framework' },
    { name: 'PostgreSQL', desc: 'Enterprise database' },
    { name: 'Express.js', desc: 'Node.js backend' },
    { name: 'Prisma ORM', desc: 'Database toolkit' },
    { name: 'Docker', desc: 'Containerization' },
    { name: 'n8n', desc: 'Workflow automation' },
    { name: 'Tailwind CSS', desc: 'Utility-first CSS' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-beauty">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-gray-900 mb-4">
            Built with{' '}
            <span className="text-gradient">Modern Technology</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            Enterprise-grade technology stack ensuring scalability, security, and performance.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className={`text-center p-4 animate-slide-up animate-delay-${index * 100}`}
            >
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-beauty rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-beauty">
                {tech.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
              <p className="text-sm text-gray-600">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="container-beauty">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-beauty rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Beauty Platform</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
              <a href="#tech" className="text-gray-600 hover:text-gray-900 transition-colors">Technology</a>
              <button className="btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="services">
          <ServicesSection />
        </div>
        <div id="tech">
          <TechStackSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white section-padding-sm">
        <div className="container-beauty">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-beauty rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Beauty Platform</span>
            </div>
            <p className="text-gray-400 mb-4">
              Professional multi-tenant SaaS for beauty salons
            </p>
            <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-rose-500" />
              <span>by DesignCorporation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;