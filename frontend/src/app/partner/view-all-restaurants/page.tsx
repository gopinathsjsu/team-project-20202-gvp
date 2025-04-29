"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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

export default function ViewAllRestaurants() {
  const { tokens, isAuthenticated } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!isAuthenticated || !tokens) {
        setError("You must be logged in to view restaurants");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://192.168.1.115:8000/api/restaurants/my-restaurants/", {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
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

  const renderCostRating = (rating: number) => {
    return "$".repeat(rating);
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
          <div key={restaurant.restaurant_id} className="border rounded-lg overflow-hidden shadow-md">
            <div className="p-4">
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
              
              <div className="mt-4 flex justify-end space-x-2">
                <Link 
                  href={`/partner/edit-restaurant/${restaurant.restaurant_id}`}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Edit
                </Link>
                <Link 
                  href={`/partner/view-restaurant/${restaurant.restaurant_id}`}
                  className="px-3 py-1 bg-primary text-black rounded text-sm hover:bg-primary/90"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
