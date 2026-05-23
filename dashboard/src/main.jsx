import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './services/axiosConfig'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Service Worker registered', reg);
    }).catch(err => {
      console.error('Service Worker registration failed', err);
    });
  });
}
