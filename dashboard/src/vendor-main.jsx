import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import VendorScreen from './pages/VendorScreen'
import VendorLanding from './pages/VendorLanding'
import './index.css'
import './services/axiosConfig'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for vendor PWA
registerSW({ immediate: true })

createRoot(document.getElementById('vendor-root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/vendor" replace />} />
        <Route path="/vendor" element={<VendorLanding />} />
        <Route path="/vendor/:outletId" element={<VendorScreen />} />
        <Route path="*" element={<Navigate to="/vendor" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)