'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { CalendarIcon, Clock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { getApiUrl } from "@/lib/config";

interface Restaurant {
  restaurant_id: number;
  name: string;
  cuisine_type: string;
  cost_rating: number;
  rating: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  photos: string[];
  description: string;
  contact_info: string;
}

export default function BookRestaurantPage() {
  // Properly unwrap params using React.use() for future compatibility
  
  
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const people = searchParams.get('people') || '2';
  const slot_id = searchParams.get('slot_id') || '';
  const restaurantId = searchParams.get('restaurant_id') || '';
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [occasion, setOccasion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receiveTextUpdates, setReceiveTextUpdates] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tokens } = useAuth();
 


  // Format date for display
  const displayDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`restaurants/${restaurantId}`));
        
        if (!response.ok) {
          throw new Error('Failed to fetch restaurant data');
        }
        
        const data = await response.json();
        setRestaurant(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        setError('Could not load restaurant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId]);

  const handleSubmitReservation = async () => {
    if (!slot_id) {
      toast.error("Missing reservation slot information");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        slot_id: parseInt(slot_id),
        number_of_people: parseInt(people),
        special_request: specialRequest,
        occasion: occasion,
        phone_number: phoneNumber
      };
      
      const response = await fetch(getApiUrl('bookings/create-booking/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create reservation');
      }
      
      toast.success('Reservation created successfully!');
      router.push('/my-bookings');
    } catch (err) {
      console.error('Error creating reservation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
        <h2 className="text-xl font-medium">Loading reservation details...</h2>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-medium mb-4">Something went wrong!</h2>
        <p className="mb-6">{error || 'Could not load restaurant details.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mt-8 mb-16">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium">You&apos;re almost done!</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-start mb-6">
              <div className="mr-4">
                <Image 
                  src={restaurant.photos && restaurant.photos.length > 0 
                    ? restaurant.photos[0] 
                    : "https://source.unsplash.com/random/200x150/?restaurant"}
                  alt={restaurant.name} 
                  width={100} 
                  height={100} 
                  className="rounded-md object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-medium">{restaurant.name}</h2>
                <div className="flex items-center mt-2">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  <span>{displayDate}</span>
                </div>
                <div className="flex items-center mt-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{decodeURIComponent(time)} PM</span>
                </div>
                <div className="flex items-center mt-2">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{people} people</span>
                </div>
              </div>
            </div>
            
            
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Diner details</h3>
    
              
              <div className="mt-4">
                <div className="flex border rounded-md overflow-hidden">
                  <div className="bg-black-300 p-3 flex items-center justify-center">
                    <span className="text-sm">🇺🇸 +1</span>
                  </div>
                  <input 
                    type="tel" 
                    placeholder="Phone number" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 p-3 outline-none"
                  />
                </div>
                
              </div>
              
              <p className="mt-4">You will receive a text message to verify your account. Message & data rates may apply.</p>

            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Reservation details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select 
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full p-3 border rounded-md"
                    aria-label="Select an occasion"
                  >
                    <option value="">Select an occasion (optional)</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="date">Date</option>
                    <option value="business">Business Meal</option>
                  </select>
                </div>
                <div>
                  <textarea 
                    placeholder="Add a special request (optional)" 
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    className="w-full p-3 border rounded-md"
                    rows={1}
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-4">
                
                
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    id="text-updates" 
                    checked={receiveTextUpdates}
                    onChange={() => setReceiveTextUpdates(!receiveTextUpdates)}
                    className="mt-1 mr-2"
                  />
                  <label htmlFor="text-updates">
                    Yes, I want to get text updates and reminders about my reservations.
                  </label>
                </div>
              </div>
              
              <button 
                className="w-full bg-red-500 text-white py-3 px-4 rounded-md mt-6 hover:bg-red-600 transition"
                onClick={handleSubmitReservation}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Complete reservation'}
              </button>
              
             
            </div>
          </div>
          
          <div className="bg-black-300 p-6 rounded-md border">
            <h3 className="text-lg font-medium mb-4">What to know before you go</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Important dining information</h4>
              <p className="text-sm">
                We have a 15 minute grace period. Please call us if you are running later than 15 minutes after your reservation time.
              </p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm">
                We may contact you about this reservation, so please ensure your email and phone number are up to date.
              </p>
            </div>
            
            <div>
              <p className="text-sm">
                Your table will be reserved for 1 hour 30 minutes for parties of up to 2; and 2 hours for parties of 3+.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 