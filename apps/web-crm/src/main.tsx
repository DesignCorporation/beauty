import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/calendar.css';
import App from './App.tsx';

// GitHub Pages SPA routing support
if (typeof window !== 'undefined') {
  const redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== location.href) {
    history.replaceState(null, null, redirect);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
