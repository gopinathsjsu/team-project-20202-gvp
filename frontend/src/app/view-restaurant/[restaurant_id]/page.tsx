"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Star, Utensils, DollarSign, MapPin, Phone, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Script from "next/script";
import { getApiUrl } from "@/lib/config";

// Add Google Maps types
interface GoogleMapMouseEvent {
  latLng: {
    lat: () => number;
    lng: () => number;
  };
}

// Google Maps specific type
interface GoogleMap {
  addListener: (event: string, callback: (e: GoogleMapMouseEvent) => void) => void;
}

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (
          element: HTMLElement, 
          options: {
            zoom: number;
            center: { lat: number; lng: number };
            mapTypeControl: boolean;
            streetViewControl: boolean;
            fullscreenControl: boolean;
          }
        ) => GoogleMap;
        Marker: new (
          options: {
            position: { lat: number; lng: number } | null;
            map: GoogleMap;
            draggable: boolean;
            animation: number;
          }
        ) => { 
          setPosition: (position: { lat: number; lng: number } | { lat: () => number; lng: () => number }) => void;
          addListener: (event: string, callback: (e: GoogleMapMouseEvent) => void) => void;
        };
        Animation: {
          DROP: number;
        };
      };
    };
  }
}

interface Review {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
}

interface Restaurant {
  restaurant_id: number;
  name: string;
  cuisine_type: string;
  cost_rating: number;
  rating: number;
  times_booked_today: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  reviews: Review[];
  description: string;
  contact_info: string;
  location: { lat: number; lng: number } | null;
}

interface TimeSlot {
  id: number;
  time: string;
  available: boolean;
  table_size: number;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tokens } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("12:00");
  const [partySize, setPartySize] = useState<number>(2);
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedSlotID, setSelectedSlotID] = useState<number | null>(null);
  // Google Maps API key - clean any trailing non-alphanumeric characters
  const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const googleMapsApiKey = rawApiKey.replace(/[^a-zA-Z0-9_-]/g, "");
  
  // Format currency based on cost rating
  const formatCostRating = (rating: number) => {
    return `$${rating}`;
  };

  // Format date for reviews
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Generate time slots in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    const start = new Date();
    start.setHours(9, 0, 0, 0); // Start at 9:00 AM
    const end = new Date();
    end.setHours(21, 0, 0, 0); // End at 9:00 PM
    
    const increment = (date: Date) => {
      const result = new Date(date);
      result.setMinutes(result.getMinutes() + 30);
      return result;
    };
    
    for (let current = new Date(start); current <= end; current = increment(current)) {
      const timeString = format(current, "HH:mm");
      slots.push(timeString);
    }
    
    return slots;
  };
  
  const timeDropdownOptions = generateTimeSlots();

  // Get star rating display
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${
              i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } mr-1`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Redirect to Google Maps
  const redirectToGoogleMaps = () => {
    if (restaurant?.location) {
      const { lat, lng } = restaurant.location;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  // Handle Google Maps script loading
  const handleMapsLoaded = () => {
    console.log("Google Maps script loaded");
    setMapsLoaded(true);
  };

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`restaurants/${params.restaurant_id}`), {
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch restaurant details");
        }

        const data = await response.json();
        console.log("Restaurant data received:", {
          id: data.restaurant_id,
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          photos: data.photos,
          reviews: data.reviews,
        });

        // Transform API response to match our component's expected format
        const transformedData = {
          ...data,
          // Convert latitude/longitude to location object for Google Maps
          location: (data.latitude && data.longitude) 
            ? { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) } 
            : { lat: 37.7749, lng: -122.4194 } // Default to San Francisco if no coordinates
        };

        setRestaurant(transformedData);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message || "An error occurred");
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [params.restaurant_id, tokens]);

  // Initialize map when restaurant data changes and maps are loaded
  useEffect(() => {
    console.log("Map initialization useEffect triggered", {
      hasRestaurant: !!restaurant,
      hasLocation: !!restaurant?.location,
      mapsLoaded
    });
    
    if (!restaurant?.location || !mapsLoaded || !mapRef.current || typeof window.google === 'undefined') {
      return;
    }
    
    try {
      console.log("Initializing map with location:", restaurant.location);
      
      // Clear any previous content in the map container
      while (mapRef.current.firstChild) {
        mapRef.current.removeChild(mapRef.current.firstChild);
      }
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: restaurant.location,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });
      
      // Create marker at the restaurant location using the exact coordinates from the API
      new window.google.maps.Marker({
        position: {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        },
        map: map,
        draggable: false,
        animation: window.google.maps.Animation.DROP,
      });
      
      setMapError(null);
    } catch (error) {
      console.error("Google Maps error:", error);
      setMapError("Failed to initialize Google Maps: " + (error instanceof Error ? error.message : String(error)));
    }
  }, [restaurant?.location, mapsLoaded]);

  // Fetch time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!params.restaurant_id) return;

      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        console.log("Fetching time slots with:", { 
          date: formattedDate, 
          time: selectedTime, 
          people: partySize 
        });
        
        const response = await fetch(
          getApiUrl(`restaurants/${params.restaurant_id}/time-slots/?date=${formattedDate}&time=${selectedTime}&people=${partySize}`),
          {
            headers: {
              ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch time slots");
        }

        const data = await response.json();
        console.log("Slots fetched:", data);
        
        // Extract the available_time_slots from the response
        if (data && data.available_time_slots) {
          setAvailableSlots(data.available_time_slots);
          console.log("Available slots set:", data.available_time_slots);
        } else {
          console.warn("No available_time_slots found in response", data);
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error("Error fetching time slots:", err);
      }
    };

    fetchTimeSlots();
  }, [params.restaurant_id, selectedDate, partySize, selectedTime, tokens]);

  // Handle reservation
  const handleReservation = () => {
    // Redirect to booking page with necessary parameters
    router.push(
      `/book-restaurant/${params.restaurant_id}?date=${format(selectedDate, "yyyy-MM-dd")}&time=${selectedTimeSlot}&people=${partySize}&slot_id=${selectedSlotID}`
    );
  };

  // Handle review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokens?.access) {
      alert("You must be logged in to submit a review");
      return;
    }
    
    try {
      setSubmittingReview(true);
      const response = await fetch(getApiUrl(`bookings/reviews/create/`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`
        },
        body: JSON.stringify({
          restaurant_id: params.restaurant_id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit review");
      }
      
      // Update the restaurant data to include the new review
      const updatedResponse = await fetch(getApiUrl(`restaurants/${params.restaurant_id}`), {
        headers: {
          Authorization: `Bearer ${tokens.access}`
        }
      });
      
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setRestaurant(updatedData);
      }
      
      // Reset form
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading restaurant details...</p>
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

  if (!restaurant) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="text-center">Restaurant not found</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Google Maps Script - Only load if API key is available and properly formatted AND restaurant data is loaded */}
        {googleMapsApiKey && googleMapsApiKey.length > 10 && restaurant?.location && (
            <Script
            id="google-maps"
            strategy="afterInteractive"
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
            onLoad={handleMapsLoaded}
            onError={() => console.error("Google Maps script failed to load")}
            />
        )}
        
        {/* Restaurant Header Section */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
                <Utensils size={16} className="mr-1" />
                <span>{restaurant.cuisine_type}</span>
            </div>
            <div className="flex items-center">
                <DollarSign size={16} className="mr-1" />
                <span>{formatCostRating(restaurant.cost_rating)}</span>
            </div>
            <div className="flex items-center">
                {renderStars(restaurant.rating)}
            </div>
            <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>Booked {restaurant.times_booked_today} times today</span>
            </div>
            </div>
            <div className="flex items-center mb-4 text-sm">
            <MapPin size={16} className="mr-1 flex-shrink-0" />
            <span>
                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
            </span>
            </div>
            <div className="flex items-center text-sm">
            <Phone size={16} className="mr-1" />
            <span>{restaurant.contact_info}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Photos + Description */}
            <div className="lg:col-span-2">
            {/* Photos Gallery */}
            <div className="mb-8">
                <div className="relative w-full h-96 rounded-lg overflow-hidden mb-2">
                {restaurant.photos.length > 0 ? (
                    <Image
                    src={restaurant.photos[activePhoto]}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                    priority
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                    </div>
                )}
                </div>
                {restaurant.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {restaurant.photos.map((photo, index) => (
                    <div
                        key={index}
                        className={`relative w-20 h-20 rounded-md cursor-pointer overflow-hidden ${
                        index === activePhoto ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setActivePhoto(index)}
                    >
                        <Image
                        src={photo}
                        alt={`${restaurant.name} photo ${index + 1}`}
                        fill
                        className="object-cover"
                        />
                    </div>
                    ))}
                </div>
                )}
            </div>

            {/* Description Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700">{restaurant.description}</p>
            </div>

            {/* Map Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                {restaurant.location ? (
                    <div>
                        <div className="relative">
                            <div 
                                id="map" 
                                ref={mapRef}
                                style={{ 
                                    width: "100%", 
                                    height: "300px", 
                                    borderRadius: "0.5rem",
                                    backgroundColor: "#f0f0f0",
                                    position: "relative" 
                                }} 
                                className="border mb-3" 
                            />
                        </div>
                        {mapError && (
                            <div className="mt-2 p-3 border border-red-300 bg-red-50 rounded-md">
                                <p className="text-sm text-red-500">{mapError}</p>
                                {restaurant.location && (
                                    <p className="text-sm mt-2">
                                        Location coordinates: {restaurant.location.lat.toFixed(6)}, {restaurant.location.lng.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        )}
                        <button
                            onClick={redirectToGoogleMaps}
                            className="flex items-center justify-center gap-2 mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Open in Google Maps
                            <ExternalLink size={16} />
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500">Location information is not available.</p>
                )}
            </div>

            {/* Reviews Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  <button 
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
                  >
                    {showReviewForm ? "Cancel" : "Add Review"}
                  </button>
                </div>
                
                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className=" bg-black border-2 p-4 rounded-lg mb-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-white-600">Rating</label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                          >
                            <Star 
                              size={24} 
                              className={`${
                                star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              } mr-1 cursor-pointer`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="reviewComment" className="block text-sm font-medium mb-1 text-white-600">
                        Comment
                      </label>
                      <textarea
                        id="reviewComment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-gray-200"
                        rows={4}
                        required
                        placeholder="Share your experience..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewComment.trim()}
                      className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </form>
                )}
                
                {restaurant.reviews && restaurant.reviews.length > 0 ? (
                <div className="space-y-6">
                    {restaurant.reviews.map((review) => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-4">
                        <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{review.customer_name}</div>
                        <div className="text-sm text-gray-500">{formatReviewDate(review.created_at)}</div>
                        </div>
                        <div className="mb-2">{renderStars(review.rating)}</div>
                        <p className="text-gray-700">{review.comment}</p>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-gray-500">No reviews yet.</p>
                )}
            </div>
            </div>

            {/* Right Column: Reservation Form */}
            <div className="lg:col-span-1">
            <div className="sticky top-4 bg-black text-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Make a Reservation</h2>
                
                {/* Date Selector */}
                <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                    <button className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-left flex items-center justify-between">
                        <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-300" />
                        <span>{format(selectedDate, "MMMM d, yyyy")}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-300" />
                    </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                    </PopoverContent>
                </Popover>
                </div>
                
                {/* Time Selector */}
                <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Time</label>
                <div className="relative">
                    <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 appearance-none text-white"
                    aria-label="Select time"
                    >
                    {timeDropdownOptions.map((time) => (
                          <option key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                          </option>
                        ))
                    }
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Clock className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
                </div>

                {/* Party Size Selector */}
                <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Party Size</label>
                <div className="relative">
                    <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 appearance-none text-white"
                    aria-label="Select party size"
                    >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <option key={size} value={size}>
                        {size} {size === 1 ? "person" : "people"}
                        </option>
                    ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Users className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
                </div>

                {/* Time Slots */}
                <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Available Slots</label>
                {/* <div className="my-2">
                  <p className="text-sm text-gray-400">Debug: {availableSlots.length} slots found</p>
                </div> */}
                {availableSlots && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                        <button
                        key={slot.id}
                        onClick={() =>  {setSelectedTimeSlot(slot.time); setSelectedSlotID(slot.id)}}
                        
                        className={`
                            py-2 px-3 text-sm rounded-md text-center
                            ${
                            selectedTimeSlot === slot.time
                                ? "bg-primary text-black"
                                : slot.available
                                ? "bg-gray-800 border border-gray-700 hover:bg-gray-700"
                                : "bg-gray-900 text-gray-600 "
                            }
                        `}
                        >
                        {format(new Date(`2000-01-01T${slot.time}`), "h:mm a")}
                      
                        </button>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No available time slots for this date and party size.</p>
                )}
                </div>

                {/* Reservation Button */}
                <button
                onClick={handleReservation}
                className={`w-full py-2 rounded-md font-medium ${
                    selectedTimeSlot
                    ? "bg-primary text-black hover:bg-primary/90 cursor-pointer"
                    : "bg-gray-800 text-gray-500 "
                }`}
                >
                Reserve Now
                </button>
            </div>
            </div>
        </div>
        </div>
    </ProtectedRoute>
  );
}
