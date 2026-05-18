import { useState } from 'react';
import './App.css';
import OrdersList from './pages/OrdersList';
import KDSScreen from './pages/KDSScreen';
import Reports from './pages/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState('kds');

  // Mock outlet context (replace with actual Firebase auth)
  const outlet = {
    organizationId: 'org-001',
    outletId: 'outlet-001',
    outletName: 'Downtown Branch'
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h1>R-OS — KDS & Orders</h1>
        <div className="nav-buttons">
          <button 
            className={currentPage === 'kds' ? 'active' : ''}
            onClick={() => setCurrentPage('kds')}
          >
            KDS Board
          </button>
          <button 
            className={currentPage === 'orders' ? 'active' : ''}
            onClick={() => setCurrentPage('orders')}
          >
            Orders
          </button>
          <button 
            className={currentPage === 'reports' ? 'active' : ''}
            onClick={() => setCurrentPage('reports')}
          >
            Reports
          </button>
        </div>
      </nav>

      <main className="page-container">
        {currentPage === 'kds' && <KDSScreen outlet={outlet} />}
        {currentPage === 'orders' && <OrdersList outlet={outlet} />}
        {currentPage === 'reports' && <Reports outlet={outlet} />}
      </main>
    </div>
  );
}