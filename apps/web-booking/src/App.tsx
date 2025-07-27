import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, Star, Heart } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
  description?: string;
  category: string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  serviceId: string;
  date: string;
  time: string;
}

const mockServices: Service[] = [
  { id: '1', name: 'Strzyżenie damskie', duration: 45, price: 150, currency: 'PLN', category: 'Włosy', description: 'Mycie + strzyżenie + stylizacja' },
  { id: '2', name: 'Koloryzacja', duration: 120, price: 300, currency: 'PLN', category: 'Włosy', description: 'Pełna koloryzacja włosów' },
  { id: '3', name: 'Manicure hybrydowy', duration: 60, price: 80, currency: 'PLN', category: 'Paznokcie' },
  { id: '4', name: 'Regulacja brwi', duration: 30, price: 40, currency: 'PLN', category: 'Brwi i rzęsy' },
];

const mockTimeSlots: TimeSlot[] = [
  { id: '1', time: '09:00', available: true },
  { id: '2', time: '10:00', available: true },
  { id: '3', time: '11:00', available: false },
  { id: '4', time: '12:00', available: true },
  { id: '5', time: '14:00', available: true },
  { id: '6', time: '15:00', available: true },
  { id: '7', time: '16:00', available: false },
];

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    serviceId: '',
    date: '',
    time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData(prev => ({ ...prev, serviceId: service.id }));
    setCurrentStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, date }));
    setCurrentStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, time }));
    setCurrentStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Rezerwacja została wysłana! Skontaktujemy się z Tobą wkrótce.');
    setIsSubmitting(false);
    
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setFormData({
      name: '',
      phone: '',
      email: '',
      serviceId: '',
      date: '',
      time: ''
    });
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('pl-PL', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      });
    }
    return dates;
  };

  const categories = [...new Set(mockServices.map(s => s.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Demo Salon
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Warszawa</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>+48 123 456 789</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                currentStep >= step 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 transition-all ${
                  currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Wybierz usługę
              </h2>
              
              {categories.map(category => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-purple-600" />
                    {category}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {mockServices
                      .filter(service => service.category === category)
                      .map(service => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">
                              {service.name}
                            </h4>
                            <span className="text-lg font-bold text-purple-600">
                              {service.price} {service.currency}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{service.duration} min</span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && selectedService && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Wybierz datę
              </h2>
              
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Wybrana usługa:</h3>
                <p className="text-purple-700">{selectedService.name} - {selectedService.duration} min - {selectedService.price} {selectedService.currency}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
                {generateDates().map(date => (
                  <button
                    key={date.value}
                    onClick={() => handleDateSelect(date.value)}
                    className="p-3 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-center"
                  >
                    <div className="text-sm font-medium text-gray-900">{date.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Wybierz godzinę
              </h2>
              
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="text-purple-700">
                  {selectedService?.name} - {selectedDate} - {selectedService?.duration} min
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
                {mockTimeSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 border-2 rounded-xl transition-all ${
                      slot.available 
                        ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50' 
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Twoje dane kontaktowe
              </h2>
              
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Podsumowanie rezerwacji:</h3>
                <p className="text-purple-700">
                  {selectedService?.name} - {selectedDate} o {selectedTime} - {selectedService?.price} {selectedService?.currency}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię i nazwisko *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Wpisz swoje imię i nazwisko"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numer telefonu *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+48 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="twoj@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Wysyłanie...' : 'Zarezerwuj wizytę'}
                </button>
              </form>
            </div>
          )}
        </div>

        {currentStep > 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Wróć do poprzedniego kroku
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;