import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Calendar, Sparkles } from 'lucide-react';
import BookingModal from './components/BookingModal';
import './index.css';

interface WidgetProps {
  salonSlug?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  buttonText?: string;
  primaryColor?: string;
}

const BookingWidget: React.FC<WidgetProps> = ({
  salonSlug = 'demo-salon',
  theme = 'light',
  position = 'bottom-right',
  buttonText = 'Book Now',
  primaryColor = '#b084ff'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-900 text-white border-gray-700'
  };

  return (
    <>
      {/* Floating Widget Button */}
      <div className={`fixed z-50 ${positionClasses[position]}`}>
        {!isMinimized ? (
          <div className={`rounded-2xl shadow-2xl border ${themeClasses[theme]} p-4 max-w-xs animate-slide-up`}>
            {/* Widget Header */}
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Beauty Platform</h3>
                <p className="text-xs opacity-75">Book your appointment</p>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="ml-auto text-xs opacity-50 hover:opacity-75"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold">40+</div>
                <div className="opacity-75">Services</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold">5 min</div>
                <div className="opacity-75">Booking</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              {buttonText}
            </button>

            {/* Trust Indicators */}
            <div className="mt-3 text-center text-xs opacity-60">
              ⭐ 4.9/5 rating • 1000+ bookings
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <Calendar className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

// Widget initialization function
declare global {
  interface Window {
    BeautyWidget: {
      init: (options: WidgetProps) => void;
    };
  }
}

window.BeautyWidget = {
  init: (options: WidgetProps = {}) => {
    // Find or create widget container
    let container = document.getElementById('beauty-widget-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'beauty-widget-container';
      document.body.appendChild(container);
    }

    // Render widget
    const root = ReactDOM.createRoot(container);
    root.render(<BookingWidget {...options} />);
  }
};

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-beauty-widget]');
  if (script) {
    const options: WidgetProps = {
      salonSlug: script.getAttribute('data-salon-slug') || undefined,
      theme: (script.getAttribute('data-theme') as 'light' | 'dark') || 'light',
      position: (script.getAttribute('data-position') as any) || 'bottom-right',
      buttonText: script.getAttribute('data-button-text') || undefined,
      primaryColor: script.getAttribute('data-primary-color') || undefined,
    };
    window.BeautyWidget.init(options);
  }
});

export default BookingWidget;