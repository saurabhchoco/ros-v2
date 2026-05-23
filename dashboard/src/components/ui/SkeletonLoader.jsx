import React from 'react';

export default function SkeletonLoader({ count = 3, className = 'h-4 w-full' }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-200 rounded ${className}`} />
      ))}
    </div>
  );
}