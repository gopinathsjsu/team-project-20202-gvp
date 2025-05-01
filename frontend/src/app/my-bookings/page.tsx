'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Calendar, Clock, Users, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Booking {
  booking_id: number;
  restaurant_name: string;
  restaurant_id: number;
  booking_date: string;
  booking_time: string;
  num_of_people: number;
  special_request?: string;
  occasion?: string;
  status: string;
  restaurant_address: string;
  restaurant_photo?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { tokens } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!tokens?.access) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('http://192.168.1.115:8000/api/bookings/my-bookings/', {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Could not load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [tokens, router]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.1.115:8000/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Update bookings list
      setBookings(bookings.map(booking => 
        booking.booking_id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      toast.success('Reservation cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel reservation. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">My Reservations</h1>
        
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">You don't have any reservations yet.</p>
            <Link 
              href="/restaurants"
              className="inline-block px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Find a restaurant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <div 
                key={booking.booking_id} 
                className={`border rounded-lg p-6 ${
                  booking.status === 'cancelled' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      <Link 
                        href={`/view-restaurant/${booking.restaurant_id}`}
                        className="hover:underline hover:text-red-500"
                      >
                        {booking.restaurant_name}
                      </Link>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{booking.booking_time}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{booking.num_of_people} {booking.num_of_people === 1 ? 'person' : 'people'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="truncate">{booking.restaurant_address}</span>
                      </div>
                    </div>
                    
                    {booking.special_request && (
                      <div className="mb-2">
                        <span className="font-medium">Special request:</span> {booking.special_request}
                      </div>
                    )}
                    
                    {booking.occasion && (
                      <div className="mb-2">
                        <span className="font-medium">Occasion:</span> {booking.occasion}
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex md:flex-col justify-end">
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition mr-2 md:mr-0 md:mb-2"
                      >
                        Cancel
                      </button>
                    )}
                    
                    <Link 
                      href={`/view-restaurant/${booking.restaurant_id}`}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                    >
                      View Restaurant <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 