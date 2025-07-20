(function() {
  'use strict';
  
  function createBookingWidget(options) {
    const salon = options.salon || 'demo-salon';
    const theme = options.theme || 'beauty';
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 10000;
      justify-content: center;
      align-items: center;
    `;
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `/${salon}/book?embed=1`;
    iframe.style.cssText = `
      width: 90%;
      max-width: 800px;
      height: 80%;
      border: none;
      border-radius: 12px;
      background: white;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    
    // Close modal
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
    
    // Open modal function
    window.openBookingWidget = function() {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };
    
    // Auto-attach to booking buttons
    document.addEventListener('DOMContentLoaded', function() {
      const buttons = document.querySelectorAll('[data-booking-widget]');
      buttons.forEach(button => {
        button.addEventListener('click', window.openBookingWidget);
      });
    });
  }
  
  // Auto-initialize
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const salon = currentScript.getAttribute('data-salon') || 
                currentScript.src.match(/salon=([^&]+)/)?.[1] || 
                'demo-salon';
  
  createBookingWidget({ salon });
})();
