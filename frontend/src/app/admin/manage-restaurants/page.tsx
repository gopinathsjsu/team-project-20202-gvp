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
  onDelete 
}: { 
  restaurant: Restaurant; 
  onDelete: (id: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-4 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{restaurant.name}</h3>
          <p className="text-gray-400">{restaurant.cuisine_type}</p>
        </div>
        <div className="flex flex-col items-end">
          {!confirmDelete ? (
            <button 
              onClick={() => setConfirmDelete(true)}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded mb-2"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center space-x-2 mb-2">
              <button 
                onClick={() => onDelete(restaurant.restaurant_id)}
                className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
              <button 
                onClick={() => setConfirmDelete(false)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          )}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-2">
          <span className="font-semibold">Address:</span> {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
        </div>
        {expanded && (
          <>
            <div className="text-gray-300 mb-2">
              <span className="font-semibold">Contact:</span> {restaurant.contact_info}
            </div>
            <div className="text-gray-300 mb-2">
              <span className="font-semibold">Cuisine:</span> {restaurant.cuisine_type}
            </div>
            {restaurant.description && (
              <div className="text-gray-300 mb-2">
                <span className="font-semibold block mb-1">Description:</span>
                <p className="text-sm">{restaurant.description}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function ManageRestaurantsPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [, setRemoving] = useState<Record<number, boolean>>({});

  // Fetch approved restaurants
  useEffect(() => {
    const fetchApprovedRestaurants = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl("restaurants/admin/approved/"), {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }

        const data = await response.json();
        setRestaurants(data);
        setFilteredRestaurants(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to load restaurants");
        setLoading(false);
      }
    };

    if (isAuthenticated && tokens?.access) {
      fetchApprovedRestaurants();
    }
  }, [isAuthenticated, tokens?.access]);

  // Filter restaurants when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "Admin")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  // Handle delete restaurant
  const handleDelete = async (restaurantId: number) => {
    try {
      setRemoving((prev) => ({ ...prev, [restaurantId]: true }));
      const response = await fetch(getApiUrl(`restaurants/admin/remove/${restaurantId}/`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete restaurant");
      }

      // Remove deleted restaurant from the list
      const updatedRestaurants = restaurants.filter(restaurant => restaurant.restaurant_id !== restaurantId);
      setRestaurants(updatedRestaurants);
      setFilteredRestaurants(updatedRestaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      setSuccessMessage("Restaurant deleted successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      setError("Failed to delete restaurant");
      
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
          <h1 className="text-2xl font-bold text-white">Manage Restaurants</h1>
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
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, city, or cuisine type..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Restaurant List */}
        <div className="bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Approved Restaurants</h2>
          
          {loading ? (
            <div className="text-center py-4">Loading restaurants...</div>
          ) : filteredRestaurants.length > 0 ? (
            <div>
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurant_id}
                  restaurant={restaurant}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              {searchTerm ? "No restaurants match your search" : "No approved restaurants found"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 