'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookRestaurantPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if accessed directly without restaurant ID
    router.push('/');
  }, [router]);

  return null;
} 