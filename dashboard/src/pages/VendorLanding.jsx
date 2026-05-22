import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VendorLanding() {
  const navigate = useNavigate();
  const [outletId, setOutletId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (outletId.trim()) {
      localStorage.setItem('last_vendor_outlet', outletId);
      navigate(`/vendor/${outletId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🍽️</div>
          <h1 className="text-3xl font-bold text-indigo-600">R-OS</h1>
          <p className="text-gray-500 mt-1">Vendor Dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Outlet ID"
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg mb-4 text-center text-lg"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg"
          >
            Continue
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          Enter outlet ID provided by your brand owner
        </p>
      </div>
    </div>
  );
}