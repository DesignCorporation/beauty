import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Calendar, X } from 'lucide-react';

function BookingWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        style={{ zIndex: 9999 }}
      >
        <Calendar className="w-6 h-6" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Umów wizytę</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Demo Salon</h3>
                <p className="text-gray-600">Zarezerwuj wizytę w naszym salonie</p>
              </div>
              
              <button
                onClick={() => {
                  window.open('https://designcorporation.github.io/beauty/', '_blank');
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Przejdź do rezerwacji
              </button>
              
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Telefon:</span>
                  <span>+48 123 456 789</span>
                </div>
                <div className="flex justify-between">
                  <span>Adres:</span>
                  <span>Warszawa</span>
                </div>
                <div className="flex justify-between">
                  <span>Godziny:</span>
                  <span>9:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function initBeautyWidget() {
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'beauty-booking-widget';
  document.body.appendChild(widgetContainer);

  if (!document.querySelector('#beauty-widget-styles')) {
    const link = document.createElement('link');
    link.id = 'beauty-widget-styles';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.tailwindcss.com';
    document.head.appendChild(link);
  }

  const root = ReactDOM.createRoot(widgetContainer);
  root.render(<BookingWidget />);
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeautyWidget);
  } else {
    initBeautyWidget();
  }
}

if (typeof window !== 'undefined') {
  (window as any).BeautyBookingWidget = {
    init: initBeautyWidget
  };
}

export { BookingWidget, initBeautyWidget };
export default initBeautyWidget;