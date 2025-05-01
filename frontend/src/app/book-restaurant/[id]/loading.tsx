import React from 'react';

export default function BookingLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
      <h2 className="text-xl font-medium">Loading reservation details...</h2>
    </div>
  );
} 