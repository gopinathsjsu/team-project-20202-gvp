"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// Define interfaces for dashboard data
interface TopRestaurant {
  restaurant_id: number;
  name: string;
  booking_count: number;
  avg_rating: number;
}

interface BookingStatus {
  status: string;
  count: number;
}

interface DashboardData {
  total_bookings: number;
  bookings_by_status: BookingStatus[];
  top_restaurants: TopRestaurant[];
  new_restaurants: number;
  pending_restaurants: number;
  date_range: { start: string; end: string };
}

// Dashboard component
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_bookings: 0,
    bookings_by_status: [],
    top_restaurants: [],
    new_restaurants: 0,
    pending_restaurants: 0,
    date_range: { start: "", end: "" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, tokens, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/restaurants/admin/dashboard/", {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    if (isAuthenticated && tokens?.access) {
      fetchDashboardData();
    }
  }, [isAuthenticated, tokens?.access]);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold">{dashboardData.total_bookings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">New Restaurants</h3>
          <p className="text-3xl font-bold">{dashboardData.new_restaurants}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold">{dashboardData.pending_restaurants}</p>
        </div>
      </div>
      
      {/* Top Restaurants */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Top Performing Restaurants</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.top_restaurants.map((restaurant, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{restaurant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{restaurant.booking_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{restaurant.avg_rating.toFixed(1)}</td>
                </tr>
              ))}
              {dashboardData.top_restaurants.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bookings by Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.bookings_by_status.map((status, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{status.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{status.count}</td>
                </tr>
              ))}
              {dashboardData.bookings_by_status.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Admin Page Component
export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "Admin")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "Admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <div className="space-x-4">
            <Link 
              href="/admin/approve-restaurants" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              Approve Restaurants
            </Link>
            <Link 
              href="/admin/manage-restaurants" 
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Delete Restaurants
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminDashboard />
      </main>
    </div>
  );
} 