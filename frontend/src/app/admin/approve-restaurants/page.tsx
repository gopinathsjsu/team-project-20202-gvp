"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";

// Define restaurant interface
interface Restaurant {
  restaurant_id: number;
  name: string;
  cuisine_type?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  contact_info?: string;
  description?: string;
}

// Restaurant Card Component
const RestaurantCard = ({ 
  restaurant, 
  onApprove, 
  onDisapprove 
}: { 
  restaurant: Restaurant; 
  onApprove: (id: number) => void; 
  onDisapprove: (id: number) => void;
}) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-4 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{restaurant.name}</h3>
          <p className="text-gray-400">{restaurant.cuisine_type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onApprove(restaurant.restaurant_id)}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
          >
            Approve
          </button>
          <button 
            onClick={() => onDisapprove(restaurant.restaurant_id)}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
          >
            Reject
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-2">
          <span className="font-semibold">Address:</span> {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
        </div>
        <div className="text-gray-300 mb-2">
          <span className="font-semibold">Contact:</span> {restaurant.contact_info}
        </div>
        <div className="text-gray-300">
          <span className="font-semibold">Cuisine:</span> {restaurant.cuisine_type}
        </div>
      </div>
      
      {restaurant.description && (
        <div className="text-gray-300 mb-4">
          <span className="font-semibold block mb-1">Description:</span>
          <p className="text-sm">{restaurant.description}</p>
        </div>
      )}
    </div>
  );
};

export default function ApproveRestaurantsPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [, setApproving] = useState<Record<number, boolean>>({});
  const [, setRemoving] = useState<Record<number, boolean>>({});

  // Fetch unapproved restaurants
  useEffect(() => {
    const fetchUnapprovedRestaurants = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl("restaurants/admin/unapproved/"), {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }

        const data = await response.json();
        setRestaurants(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to load restaurants");
        setLoading(false);
      }
    };

    if (isAuthenticated && tokens?.access) {
      fetchUnapprovedRestaurants();
    }
  }, [isAuthenticated, tokens?.access]);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "Admin")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  // Handle approve restaurant
  const handleApprove = async (restaurantId: number) => {
    try {
      setApproving((prev) => ({ ...prev, [restaurantId]: true }));
      const response = await fetch(getApiUrl(`restaurants/admin/approve/${restaurantId}/`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve restaurant");
      }

      // Remove approved restaurant from the list
      setRestaurants(restaurants.filter(restaurant => restaurant.restaurant_id !== restaurantId));
      setSuccessMessage("Restaurant approved successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error approving restaurant:", error);
      setError("Failed to approve restaurant");
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // Handle disapprove (delete) restaurant
  const handleDisapprove = async (restaurantId: number) => {
    try {
      setRemoving((prev) => ({ ...prev, [restaurantId]: true }));
      const response = await fetch(getApiUrl(`restaurants/admin/remove/${restaurantId}/`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reject restaurant");
      }

      // Remove rejected restaurant from the list
      setRestaurants(restaurants.filter(restaurant => restaurant.restaurant_id !== restaurantId));
      setSuccessMessage("Restaurant rejected successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error rejecting restaurant:", error);
      setError("Failed to reject restaurant");
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "Admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Approve Restaurants</h1>
          <Link 
            href="/admin" 
            className="inline-block bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-900 border-l-4 border-green-500 text-green-200">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border-l-4 border-red-500 text-red-200">
            {error}
          </div>
        )}
        
        {/* Restaurant List */}
        <div className="bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Approval</h2>
          
          {loading ? (
            <div className="text-center py-4">Loading restaurants...</div>
          ) : restaurants.length > 0 ? (
            <div>
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurant_id}
                  restaurant={restaurant}
                  onApprove={handleApprove}
                  onDisapprove={handleDisapprove}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">No restaurants pending approval</div>
          )}
        </div>
      </main>
    </div>
  );
} 