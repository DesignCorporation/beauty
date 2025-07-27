import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, Mail } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const services = [
    { id: 'hair_womens_cut', name: 'Women\'s Haircut', duration: '45 min', price: '35 EUR' },
    { id: 'nails_manicure_hybrid', name: 'Hybrid Manicure', duration: '60 min', price: '30 EUR' },
    { id: 'brow_lamination', name: 'Brow Lamination', duration: '45 min', price: '35 EUR' },
    { id: 'face_basic_clean', name: 'Basic Facial', duration: '45 min', price: '40 EUR' }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const handleBooking = () => {
    // Here would be API call to create booking
    console.log('Booking:', { selectedService, selectedDate, selectedTime, clientInfo });
    alert('Booking request sent! We will confirm shortly.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className={`${step >= 1 ? 'text-beauty-600 font-medium' : 'text-gray-400'}`}>
              Service
            </span>
            <span className={`${step >= 2 ? 'text-beauty-600 font-medium' : 'text-gray-400'}`}>
              Date & Time
            </span>
            <span className={`${step >= 3 ? 'text-beauty-600 font-medium' : 'text-gray-400'}`}>
              Details
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-beauty h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 mb-4">Choose a service</h3>
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedService === service.id
                      ? 'border-beauty-500 bg-beauty-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-600">{service.duration}</div>
                    </div>
                    <div className="text-beauty-600 font-medium">{service.price}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Select date</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input w-full"
                />
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Available times</h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 text-sm rounded-xl border transition-all ${
                        selectedTime === time
                          ? 'border-beauty-500 bg-beauty-50 text-beauty-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Client Information */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Your information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                  className="input w-full"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                  className="input w-full"
                  placeholder="+48 123 456 789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                  className="input w-full"
                  placeholder="your@email.com"
                />
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Service: {services.find(s => s.id === selectedService)?.name}</div>
                  <div>Date: {selectedDate}</div>
                  <div>Time: {selectedTime}</div>
                  <div>Duration: {services.find(s => s.id === selectedService)?.duration}</div>
                  <div className="font-medium text-beauty-600">
                    Price: {services.find(s => s.id === selectedService)?.price}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedService) ||
                (step === 2 && (!selectedDate || !selectedTime))
              }
              className="btn-primary flex-1"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleBooking}
              disabled={!clientInfo.name || !clientInfo.phone}
              className="btn-primary flex-1"
            >
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;