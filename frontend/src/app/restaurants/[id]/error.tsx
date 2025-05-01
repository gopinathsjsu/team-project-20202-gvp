'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-medium mb-4">Something went wrong!</h2>
      <p className="mb-6">We couldn&apos;t load the reservation details.</p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
} 