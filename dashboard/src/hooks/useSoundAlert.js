import { useEffect, useRef, useState } from 'react';

export function useSoundAlert(orderList) {
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio on first render (user interaction may be required)
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/new-order.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  useEffect(() => {
    // Play sound when new order arrives (count increases)
    if (orderList.length > previousOrderCount && orderList.length > 0) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    setPreviousOrderCount(orderList.length);
  }, [orderList.length, previousOrderCount]);

  return audioRef;
}