"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Store } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerDashboard() {
  const { user, isAuthenticated, isLoading, tokens } = useAuth();
  const router = useRouter();
  const [restaurantCount, setRestaurantCount] = useState<number>(0);
  const [isCountLoading, setIsCountLoading] = useState<boolean>(true);

  // Fetch restaurant count
  useEffect(() => {
    const fetchRestaurantCount = async () => {
      if (!tokens?.access) return;
      
      try {
        setIsCountLoading(true);
        const response = await fetch(getApiUrl('restaurants/my-restaurants/'), {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setRestaurantCount(data.length);
        } else {
          console.error('Failed to fetch restaurants');
        }
      } catch (error) {
        console.error('Error fetching restaurant count:', error);
      } finally {
        setIsCountLoading(false);
      }
    };
    
    if (isAuthenticated && tokens?.access) {
      fetchRestaurantCount();
    }
  }, [isAuthenticated, tokens]);

  // Redirect if not authenticated or not a partner
  useEffect(() => {
    // Only redirect if we've finished loading and the user is definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/partner/login");
    }
    // Don't check for partner role yet, as it might not be loaded initially
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Only do this check after loading is complete
  if (!isAuthenticated) {
    return null; // This will prevent any flash of content before redirect
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Partner Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Partner Information Card */}
          <Card className="md:col-span-2 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">Welcome Back, {user?.username}</CardTitle>
              <CardDescription className="text-slate-400">Manage your restaurants and reservations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-slate-400 text-sm">Partner Email</span>
                <span className="text-slate-200">{user?.email}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-400 text-sm">Total Restaurants</span>
                <span className="text-slate-200">
                  {isCountLoading ? "Loading..." : restaurantCount}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Stats Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-slate-400 text-sm">Pending Reservations</span>
                <span className="text-slate-200 text-2xl font-semibold">0</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-400 text-sm">Today&apos;s Bookings</span>
                <span className="text-slate-200 text-2xl font-semibold">0</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/partner/view-all-restaurants" className="block">
            <div className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-10 text-center transition-all duration-200 h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-100">
                <Store className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">View All Restaurants</h2>
              <p className="text-slate-400">Manage your existing restaurants and their details</p>
              <Button className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-100" size="lg">
                View Restaurants
              </Button>
            </div>
          </Link>
          
          <Link href="/partner/add-new-restaurant" className="block">
            <div className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-10 text-center transition-all duration-200 h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Add New Restaurant</h2>
              <p className="text-slate-400">Create a new restaurant listing with all details</p>
              <Button className="mt-4" size="lg">
                Add Restaurant
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
