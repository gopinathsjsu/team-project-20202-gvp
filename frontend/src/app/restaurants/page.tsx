'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RestaurantsPage() {
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // If redirected here, show a simple message
    if (window.location.search.includes('redirected=true')) {
      setRedirected(true);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      {redirected ? (
        <div>
          <h2 className="text-2xl font-medium mb-4">Redirected from booking</h2>
          <p className="mb-6">Please select a restaurant to make a reservation.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-medium mb-4">Restaurants</h2>
          <p className="mb-6">View our restaurants to make a reservation.</p>
        </div>
      )}
      <Link
        href="/"
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
      >
        Return to home
      </Link>
    </div>
  );
} 