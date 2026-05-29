import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';   // ✅ add this
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

export default function ShiftHandover() {
  const navigate = useNavigate();   // ✅ for redirecting after handover
  const outlet = useAuthStore(s => s.outlet);
  const outletId = outlet?.outletId;
  const [activeUsers, setActiveUsers] = useState([]);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [cashDeclared, setCashDeclared] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [expectedCash, setExpectedCash] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showForceModal, setShowForceModal] = useState(false);
  const [forceReason, setForceReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [handoverResult, setHandoverResult] = useState(null);

  useEffect(() => {
    console.log('ShiftHandover outletId:', outletId);
    if (!outletId) {
      console.log('outletId not ready yet');
      return;
    }
    fetchActiveUsers();
  }, [outletId]);

  async function fetchActiveUsers() {
    console.log('fetchActiveUsers called');
    try {
      const res = await apiService.listActiveUsers(outletId);
      console.log('Active users response:', res.data);
      setActiveUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load active users', err);
      toast.error('Failed to load active users');
    }
  }

  const selectedFromUser = activeUsers.find(u => u.id === fromUserId);
  const isCashier = selectedFromUser?.role_id === 'CASHIER';

  useEffect(() => {
    console.log('isCashier:', isCashier);
    console.log('selectedFromUser:', selectedFromUser);
    console.log('shift_session_id:', selectedFromUser?.shift_session_id);
    if (isCashier && selectedFromUser?.shift_session_id) {
      console.log('✅ About to call getExpectedCash for shift:', selectedFromUser.shift_session_id);
      console.log('apiService.getExpectedCash function:', apiService.getExpectedCash);
      apiService.getExpectedCash(selectedFromUser.shift_session_id)
        .then(res => setExpectedCash(res.data.expected))
        .catch(err => console.error('Expected cash error:', err));
        // .catch(() => setExpectedCash(null));
    } else {
      setExpectedCash(null);
    }
  }, [fromUserId, isCashier, selectedFromUser]);

  const cashDifference = (cashDeclared !== '' && expectedCash !== null) ? (parseFloat(cashDeclared) - expectedCash) : null;

  const handleSubmit = async (e) => {
    console.log('handleSubmit called, fromUserId:', fromUserId, 'toUserId:', toUserId);
    e.preventDefault();
    if (!fromUserId || !toUserId) {
      toast.error('Please select both users');
      return;
    }
    if (fromUserId === toUserId) {
      toast.error('From user and To user must be different');
      return;
    }
    if (isCashier && cashDeclared && expectedCash) {
      const diff = Math.abs(cashDifference);
      if (diff > 100) {
        setWarnings([`Cash difference ₹${diff.toFixed(2)} exceeds ₹100 tolerance.`]);
        setShowForceModal(true);
        return;
      }
    }
    await performHandover();
  };

  const performHandover = async (force = false) => {
    console.log('performHandover called, force:', force);
    setLoading(true);
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
    const parsedCashDeclared = cashDeclared && cashDeclared !== '' ? parseFloat(cashDeclared) : null;

    try {
      const response = await apiService.handoverShift({
        outletId,
        fromUserId,
        toUserId,
        cashDeclared: parsedCashDeclared,
        notes,
        requestId,
        forceReason: force ? forceReason : null
      });
      console.log('Handover response:', response);
      setHandoverResult(response.data);
      setShowForceModal(false);
      setForceReason('');
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response?.data?.requiresForce) {
        setWarnings([err.response.data.error]);
        setShowForceModal(true);
      } else {
        toast.error(err.response?.data?.error || 'Handover failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Shift Handover</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">From User (Ending Shift)</label>
          <select
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            required
          >
            <option value="">Select user</option>
            {activeUsers.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role_id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">To User (Starting Shift)</label>
          <select
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            required
          >
            <option value="">Select user</option>
            {activeUsers.filter(u => u.id !== fromUserId).map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role_id})</option>
            ))}
          </select>
        </div>

        {isCashier && (
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Cash Handover</h3>
            <div className="mb-2">
              <span className="text-sm">Expected Cash (settled CASH orders): </span>
              <span className="font-mono font-bold">₹{expectedCash?.toFixed(2) ?? '—'}</span>
            </div>
            <div>
              <label className="block text-sm font-medium">Declared Cash (₹)</label>
              <input
                type="number"
                step="0.01"
                value={cashDeclared}
                onChange={(e) => setCashDeclared(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="Amount in cash drawer"
              />
            </div>
            {cashDeclared && expectedCash !== null && (
              <div className="mt-2 text-sm">
                Difference: <span className={`font-bold ${cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{cashDifference.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="mt-1 block w-full border rounded p-2"
            placeholder="Any additional information"
          />
        </div>

        <Button type="submit" isLoading={loading} className="w-full">
          Confirm Handover
        </Button>
      </form>

      {showSuccessModal && handoverResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">✅ SHIFT HANDOVER COMPLETE</h2>
            <div className="space-y-2 text-sm">
              <p><strong>From:</strong> {activeUsers.find(u => u.id === fromUserId)?.full_name}</p>
              <p><strong>To:</strong> {activeUsers.find(u => u.id === toUserId)?.full_name}</p>
              <p><strong>Orders Reassigned:</strong> {handoverResult.reassignedCount}</p>
              <p><strong>Cash Difference:</strong> ₹{handoverResult.cashDifference?.toFixed(2) ?? '0'}</p>
              <p><strong>Completed:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setFromUserId('');
                  setToUserId('');
                  setCashDeclared('');
                  setNotes('');
                  fetchActiveUsers();
                }}
                className="flex-1 bg-indigo-600 text-white py-2 rounded"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/orders');
                }}
                className="flex-1 border py-2 rounded"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {showForceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">⚠️ Handover Warnings</h3>
            {warnings.map((w, i) => (
              <div key={i} className="text-amber-700 bg-amber-50 p-2 rounded mb-3">{w}</div>
            ))}
            <label className="block text-sm font-medium mt-2">Force Reason (required)</label>
            <input
              type="text"
              value={forceReason}
              onChange={(e) => setForceReason(e.target.value)}
              className="w-full border rounded p-2 mt-1"
              placeholder="e.g., Emergency leave, no replacement"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => performHandover(true)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Force Handover
              </button>
              <button
                onClick={() => setShowForceModal(false)}
                className="flex-1 border py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}