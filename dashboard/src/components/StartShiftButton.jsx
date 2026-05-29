import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export default function StartShiftButton({ initialActiveShift }) {
  const outlet = useAuthStore(s => s.outlet);
  const [hasActiveShift, setHasActiveShift] = useState(!!initialActiveShift);
  const [shiftStartTime, setShiftStartTime] = useState(
    initialActiveShift?.started_at ? new Date(initialActiveShift.started_at) : null
  );
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);

  const shiftRoles = ['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'];
  const canStartShift = outlet && shiftRoles.includes(outlet.role);

  // Update state when prop changes (e.g., after handover page reload)
  useEffect(() => {
    if (initialActiveShift) {
      setHasActiveShift(true);
      setShiftStartTime(new Date(initialActiveShift.started_at));
    } else {
      setHasActiveShift(false);
      setShiftStartTime(null);
      setElapsed('00:00:00');
    }
  }, [initialActiveShift]);

  // Live timer (ticks every second)
  useEffect(() => {
    if (!hasActiveShift || !shiftStartTime) return;
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now - shiftStartTime;
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasActiveShift, shiftStartTime]);

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
    } finally { setLoading(false); }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      await apiService.endShift();
      toast.success('Shift ended');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end shift');
    } finally { setLoading(false); }
  };

  if (!canStartShift) return null;

  if (hasActiveShift) {
    return (
      <button
        onClick={handleEnd}
        disabled={loading}
        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
      >
        {loading ? 'Ending...' : `Stop Shift (${elapsed})`}
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium"
    >
      {loading ? 'Starting...' : 'Start Shift'}
    </button>
  );
}