"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/app/partner/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/config";

interface RestaurantForm {
  restaurant_id: number;
  manager_id: number;
  name: string;
  description: string;
  cuisine_type: string;
  cost_rating: number;
  contact_info: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  times_booked_today: number;
}

export default function ViewRestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { user, tokens, isLoading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(user)
    console.log(tokens)
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`restaurants/${params.restaurant_id}/`), {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch restaurant details');
        }

        const data = await response.json();
        setError(null);
        setRestaurant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    console.log(params.restaurant_id)
    console.log(tokens?.access)
    fetchRestaurant()
    // if (params.restaurant_id && tokens?.access) {
    //   fetchRestaurant();
    // } else if (!tokens?.access) {
    //   setError('Authentication required. Please log in.');
    //   setLoading(false);
    // }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading restaurant details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Restaurant not found</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <Button 
          onClick={() => router.push("/partner/view-all-restaurants")}
          className="mb-4"
          variant="outline"
        >
          ← Back to All Restaurants
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-600">{restaurant.cuisine_type}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-gray-600">{restaurant.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Cost Rating</h3>
                  <p className="text-gray-600">{`$${restaurant.cost_rating}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Address */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-gray-600">
                    {restaurant.address}<br />
                    {restaurant.city}, {restaurant.state} {restaurant.zip}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Contact</h3>
                  <p className="text-gray-600">{restaurant.contact_info}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Coordinates</h3>
                  <p className="text-gray-600">
                    Latitude: {restaurant.latitude}<br />
                    Longitude: {restaurant.longitude}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p className="text-gray-600">
                    {restaurant.approved ? "Approved" : "Pending Approval"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Bookings Today</h3>
                  <p className="text-gray-600">{restaurant.times_booked_today}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Restaurant ID</h3>
                  <p className="text-gray-600">{restaurant.restaurant_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
} 