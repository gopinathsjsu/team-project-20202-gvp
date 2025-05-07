"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/config";

interface Restaurant {
  restaurant_id: number;
  manager_id: number;
  name: string;
  description: string;
  cuisine_type: string;
  cost_rating: number;
  contact_info: string;
  address: string;
  times_booked_today: number;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

interface SlotsFormData {
  start_date: Date | undefined;
  end_date: Date | undefined;
  table_sizes: string;
}

export default function ViewAllRestaurants() {
  const { tokens, isAuthenticated } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingSlots, setIsCreatingSlots] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [slotsFormData, setSlotsFormData] = useState<SlotsFormData>({
    start_date: undefined,
    end_date: undefined,
    table_sizes: ''
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!isAuthenticated || !tokens) {
        setError("You must be logged in to view restaurants");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(getApiUrl("restaurants/my-restaurants/"), {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }
        setError(null); // Reset error state on successful fetch
        const data = await response.json();
        setRestaurants(data);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [isAuthenticated, tokens]);

  const handleSlotsFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlotsFormData({
      ...slotsFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateSlots = async (restaurantId: number) => {
    setIsCreatingSlots(true);
    setError(null);
    setSuccessMessage(null);

    if (!slotsFormData.start_date || !slotsFormData.end_date) {
      setError("Please select both start and end dates");
      setIsCreatingSlots(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl("bookings/slots/recurring/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          start_date: format(slotsFormData.start_date, 'yyyy-MM-dd'),
          end_date: format(slotsFormData.end_date, 'yyyy-MM-dd'),
          table_sizes: slotsFormData.table_sizes.split(',').map(size => parseInt(size.trim()))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create slots");
      }

      setSuccessMessage("Booking slots created successfully!");
      // Clear form data
      setSlotsFormData({
        start_date: undefined,
        end_date: undefined,
        table_sizes: ''
      });

      // Close popover after successful creation
      setTimeout(() => {
        setOpenPopoverId(null);
        setSuccessMessage(null);
      }, 3000);

    } catch (err) {
      console.error("Error creating slots:", err);
      setError(err instanceof Error ? err.message : "Failed to create slots");
    } finally {
      setIsCreatingSlots(false);
    }
  };

  const renderCostRating = (rating: number) => {
    return "$"+rating;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading restaurants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/login" className="text-primary hover:underline mt-2 block">
          Go to Login
        </Link>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-6">My Restaurants</h1>
        <p className="mb-4">You don&apos;t have any restaurants yet.</p>
        <Link 
          href="/partner/add-new-restaurant" 
          className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90"
        >
          Add a Restaurant
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Restaurants</h1>
        <Link 
          href="/partner/add-new-restaurant" 
          className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90"
        >
          Add a Restaurant
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.restaurant_id} className="border rounded-lg overflow-hidden shadow-md flex flex-col">
            <div className="p-4 flex-grow">
              <h2 className="text-xl font-semibold mb-2">{restaurant.name}</h2>
              <p className="text-gray-700 mb-2">{restaurant.description}</p>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{restaurant.cuisine_type}</span>
                <span>{renderCostRating(restaurant.cost_rating)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
              </p>
              <p className="text-sm text-gray-600 mb-4">{restaurant.contact_info}</p>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">
                  Today&apos;s Bookings: {restaurant.times_booked_today}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  restaurant.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {restaurant.approved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
              
              {successMessage && openPopoverId === restaurant.restaurant_id && (
                <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
                  {successMessage}
                </div>
              )}
            </div>
            
            <div className="mt-auto p-4 pt-0   gap-2 flex justify-end align-middle">
              <Link 
                href={`/partner/edit-restaurant/${restaurant.restaurant_id}`}
                className="px-3 py-1 bg-blue-800 text-white rounded text-sm hover:bg-blue-600"
              >
                Edit
              </Link>
              
              <Popover open={openPopoverId === restaurant.restaurant_id} onOpenChange={(open) => {
                if (open) {
                  setOpenPopoverId(restaurant.restaurant_id);
                } else {
                  setOpenPopoverId(null);
                }
              }}>
                <PopoverTrigger asChild>
                  <button 
                    className="px-3 py-1 bg-green-700 text-white rounded text-sm hover:bg-green-600 cursor-pointer"
                  >
                    Add Slots
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h3 className="font-medium">Create Booking Slots</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full flex items-center justify-between p-2 text-sm border rounded",
                              !slotsFormData.start_date && "text-muted-foreground"
                            )}
                          >
                            {slotsFormData.start_date ? format(slotsFormData.start_date, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={slotsFormData.start_date}
                            onSelect={(date) => 
                              setSlotsFormData(prev => ({ ...prev, start_date: date }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full flex items-center justify-between p-2 text-sm border rounded",
                              !slotsFormData.end_date && "text-muted-foreground"
                            )}
                          >
                            {slotsFormData.end_date ? format(slotsFormData.end_date, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={slotsFormData.end_date}
                            onSelect={(date) => 
                              setSlotsFormData(prev => ({ ...prev, end_date: date }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Table Sizes (comma-separated)</label>
                      <input
                        type="text"
                        name="table_sizes"
                        value={slotsFormData.table_sizes}
                        onChange={handleSlotsFormChange}
                        placeholder="2, 4, 6"
                        className="w-full p-2 text-sm border rounded"
                        required
                      />
                    </div>
                    
                    {error && openPopoverId === restaurant.restaurant_id && (
                      <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
                        {error}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleCreateSlots(restaurant.restaurant_id)}
                      disabled={isCreatingSlots}
                      className="w-full py-2 bg-primary text-black rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isCreatingSlots ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </span>
                      ) : (
                        "Create Slots"
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Link 
                href={`/partner/view-restaurant/${restaurant.restaurant_id}`}
                className="px-3 py-1 bg-gray-500 text-white text-black rounded text-sm hover:bg-primary/90 hover:text-black"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
