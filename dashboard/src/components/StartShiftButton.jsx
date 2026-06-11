import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export default function StartShiftButton({ initialActiveShift, showWarning, isLoading }) {
  const outlet = useAuthStore(s => s.outlet);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  const shiftRoles = ['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'];
  const canStartShift = outlet && shiftRoles.includes(outlet.role);

  // Timer effect – only runs when a shift is active
  useEffect(() => {
    if (!initialActiveShift || !initialActiveShift.started_at) return;
    const startTime = new Date(initialActiveShift.started_at);
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now - startTime;
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [initialActiveShift]);

  const handleStart = async () => {
    if (!outlet?.outletId) return;
    setLoading(true);
    try {
      await apiService.startShift({
        outletId: outlet.outletId,
        roleId: outlet.role,
        cashStartingAmount: outlet.role === 'CASHIER' ? 0 : undefined
      });
      toast.success('Shift started');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      await apiService.endShift();
      toast.success('Shift ended');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end shift');
    } finally {
      setLoading(false);
    }
  };

  if (!canStartShift) return null;

  // Show a disabled loading button while shift status is being fetched
  if (isLoading) {
    return (
      <button
        disabled
        className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-2 cursor-wait"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        Loading...
      </button>
    );
  }

  if (initialActiveShift) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleEnd}
          disabled={loading}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
        >
          {loading ? 'Ending...' : `Stop Shift (${elapsed})`}
        </button>
        {showWarning && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            ⚠️ Start shift to take and update order status.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleStart}
        disabled={loading}
        className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium"
      >
        {loading ? 'Starting...' : 'Start Shift'}
      </button>
      {showWarning && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          ⚠️ Start shift to take orders and update order status.
        </span>
      )}
    </div>
  );
}