import { useState, useEffect, useRef } from 'react';

function useElapsedTime(createdAt) {
  const [elapsed, setElapsed] = useState({ mins: 0, secs: 0 });
  useEffect(() => {
    const created = createdAt ? new Date(createdAt).getTime() : Date.now();
    const tick = () => {
      const totalSeconds = Math.floor((Date.now() - created) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setElapsed({ mins, secs });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  return elapsed;
}

export default function OrderCard({
  order,
  nextLabel,
  nextStatus,
  btnColor,
  onStatusChange,
}) {
  const [updating, setUpdating] = useState(false);
  const { mins: elapsedMins, secs: elapsedSecs } = useElapsedTime(order.createdAt);
  const staleSoundPlayed = useRef(false);

  const isStaleNew = order.orderStatus === 'NEW' && elapsedMins >= 1;

  useEffect(() => {
    if (isStaleNew && !staleSoundPlayed.current) {
      staleSoundPlayed.current = true;
      const audio = new Audio('/sounds/alert.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [isStaleNew]);

  const timerColor =
    elapsedMins >= 10
      ? 'bg-red-100 text-red-700'
      : elapsedMins >= 5
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  const handleClick = async () => {
    setUpdating(true);
    try {
      await onStatusChange(order.id, nextStatus);
    } finally {
      setUpdating(false);
    }
  };

  const time = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // More dramatic pulse class (red background flash + thick ring)
const pulseClass = isStaleNew ? 'animate-pulse-red ring-4 ring-red-500 shadow-xl' : '';


  return (
    <div
      className={`bg-white rounded-2xl shadow-md border-l-4 border-indigo-400 p-5 transition-all ${pulseClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-800 text-lg leading-tight">
            {order.orderNo}
          </p>
          {time && <p className="text-gray-400 text-xs mt-0.5">{time}</p>}
        </div>
        <span className={`${timerColor} text-xs font-bold px-2 py-1 rounded-lg`}>
          {elapsedMins}:{elapsedSecs.toString().padStart(2, '0')}
        </span>
      </div>

      <p className="uppercase text-xs tracking-widest text-gray-400 font-semibold mb-2">
        {order.orderSource || 'DINE IN'}
      </p>

      <p className="text-indigo-500 font-extrabold text-3xl mb-3">
        ₹{parseFloat(order.grandTotal || 0).toFixed(0)}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {order.tableNumber && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
            🪑 Table {order.tableNumber}
          </span>
        )}
        {order.tokenNumber && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
            🎫 Token {order.tokenNumber}
          </span>
        )}
        {order.customerName && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
            👤 {order.customerName}
          </span>
        )}
        {order.paymentMethod && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
            💳 {order.paymentMethod}
          </span>
        )}
      </div>

      <button
        onClick={handleClick}
        disabled={updating}
        className={`w-full ${btnColor} text-white rounded-xl py-3 font-bold text-sm transition-all disabled:opacity-50`}
      >
        {updating ? 'Updating...' : nextLabel}
      </button>
    </div>
  );
}