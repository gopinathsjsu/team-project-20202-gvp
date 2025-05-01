'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { CalendarIcon, Clock, Users, ChevronLeft } from 'lucide-react';

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

export default function RestaurantBookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const people = searchParams.get('people') || '2';
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [occasion, setOccasion] = useState('');
  const [subscribeToEmails, setSubscribeToEmails] = useState(false);
  const [receiveTextUpdates, setReceiveTextUpdates] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For the countdown timer - static values
  const minutesLeft = 4;
  const secondsLeft = 17;

  // Format date for display
  const displayDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });

  // Navigate back to restaurant details page
  const handleBackToRestaurant = () => {
    router.push(`/view-restaurant/${params.id}`);
  };

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://192.168.1.115:8000/api/restaurants/${params.id}`);
        
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
  }, [params.id]);

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
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackToRestaurant} 
          className="flex items-center text-gray-700 hover:text-red-500 transition"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back to {restaurant.name}</span>
        </button>
      </div>
      
      <div className="mt-4 mb-16">
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
                  <span>{people} people (Outdoor seating)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-blue-800">
                We&apos;re holding this table for you for: {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} minutes
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Diner details</h3>
              <p>
                <span className="text-red-500">Sign in</span> to collect points for this reservation
              </p>
              
              <div className="mt-4">
                <div className="flex border rounded-md overflow-hidden">
                  <div className="bg-gray-100 p-3 flex items-center justify-center">
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
                <p className="text-red-500 text-sm mt-1">Phone number is required.</p>
              </div>
              
              <p className="mt-4">You will receive a text message to verify your account. Message & data rates may apply.</p>
              <p className="text-red-500 mt-2 cursor-pointer">Use email instead</p>
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
                <div className="flex items-start mb-2">
                  <input 
                    type="checkbox" 
                    id="email-updates" 
                    checked={subscribeToEmails}
                    onChange={() => setSubscribeToEmails(!subscribeToEmails)}
                    className="mt-1 mr-2"
                    aria-label="Receive email updates"
                  />
                  <label htmlFor="email-updates">
                    Sign me up to receive dining offers and news from this restaurant by email.
                  </label>
                </div>
                
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    id="text-updates" 
                    checked={receiveTextUpdates}
                    onChange={() => setReceiveTextUpdates(!receiveTextUpdates)}
                    className="mt-1 mr-2"
                    aria-label="Receive text updates"
                  />
                  <label htmlFor="text-updates">
                    Yes, I want to get text updates and reminders about my reservations.
                  </label>
                </div>
              </div>
              
              <button 
                className="w-full bg-red-500 text-white py-3 px-4 rounded-md mt-6 hover:bg-red-600 transition"
              >
                Complete reservation
              </button>
              
              <p className="text-sm mt-4">
                By clicking &quot;Complete reservation&quot; you agree to the OpenTable Terms of Use and Privacy Policy. Message & data rates may apply. You can opt out of receiving text messages at any time in your account settings or by replying STOP.
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-md border">
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