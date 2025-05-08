"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Image from "next/image";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Info, 
  Loader2, 
  MapPin, 
  Phone, 
  Trash, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiUrl } from "@/lib/config";
// import Link from "next/link";

interface Booking {
  booking_id: number;
  customer_id: number;
  slot_id: number;
  booking_datetime: string;
  number_of_people: number;
  status: string;
  restaurant_id: number;
  slot_datetime: string;
}

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
  contact_info: string;
}

interface BookingWithRestaurant extends Booking {
  restaurant: Restaurant | null;
}

export default function MyBookingsPage() {
  const { tokens, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl("bookings/my-bookings/"), {
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      
      // Fetch restaurant details for each booking
      const bookingsWithRestaurants = await Promise.all(
        data.map(async (booking: Booking) => {
          try {
            const restaurantResponse = await fetch(
              getApiUrl(`restaurants/${booking.restaurant_id}`),
              {
                headers: {
                  Authorization: `Bearer ${tokens?.access}`,
                },
              }
            );

            if (restaurantResponse.ok) {
              const restaurantData = await restaurantResponse.json();
              return {
                ...booking,
                restaurant: restaurantData,
              };
            } else {
              console.error(`Failed to fetch restaurant ${booking.restaurant_id}`);
              return {
                ...booking,
                restaurant: null,
              };
            }
          } catch (error) {
            console.error(`Error fetching restaurant ${booking.restaurant_id}:`, error);
            return {
              ...booking,
              restaurant: null,
            };
          }
        })
      );

      setBookings(bookingsWithRestaurants);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again later.");
      setLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && tokens) {
      fetchBookings();
    }
  }, [authLoading, isAuthenticated, tokens, fetchBookings]);

  const openCancelDialog = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setConfirmDialogOpen(true);
  };

  const cancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      setCancellingBooking(true);
      const response = await fetch(getApiUrl(`bookings/my-bookings/${bookingToCancel}/cancel/`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      // Update the booking status locally
      setBookings(
        bookings.map((booking) =>
          booking.booking_id === bookingToCancel
            ? { ...booking, status: "Cancelled" }
            : booking
        )
      );

      setCancellingBooking(false);
      setConfirmDialogOpen(false);
      setBookingToCancel(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setCancellingBooking(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your bookings...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={fetchBookings}>
              Try Again
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4">You have not made any restaurant bookings yet.</p>
            <Button onClick={() => router.push('/')}>Find Restaurants</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.booking_id} className="overflow-hidden">
                {booking.restaurant?.photos && booking.restaurant.photos.length > 0 ? (
                  <div className="h-48 relative">
                    <Image
                      src={booking.restaurant.photos[0]}
                      alt={booking.restaurant?.name || "Restaurant"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate">{booking.restaurant?.name || "Unknown Restaurant"}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      booking.status === "Booked" 
                        ? "bg-green-100 text-green-800" 
                        : booking.status === "Cancelled" 
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {booking.status}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin size={16} className="mr-1" />
                      {booking.restaurant 
                        ? `${booking.restaurant.address}, ${booking.restaurant.city}`
                        : "Location unavailable"}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone size={16} className="mr-1" />
                      {booking.restaurant?.contact_info || "Contact info unavailable"}
                    </div>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Clock size={18} className="mr-2 text-primary" />
                      <div>
                        <p className="font-medium">Reservation Time</p>
                        <p className="text-sm text-gray-600">{formatDateTime(booking.slot_datetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={18} className="mr-2 text-primary" />
                      <div>
                        <p className="font-medium">Booking Made On</p>
                        <p className="text-sm text-gray-600">{formatDateTime(booking.booking_datetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Users size={18} className="mr-2 text-primary" />
                      <div>
                        <p className="font-medium">Party Size</p>
                        <p className="text-sm text-gray-600">{booking.number_of_people} {booking.number_of_people === 1 ? 'person' : 'people'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Info size={18} className="mr-2 text-primary" />
                      <div>
                        <p className="font-medium">Booking ID</p>
                        <p className="text-sm text-gray-600">{booking.booking_id}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  {booking.status === "Booked" && (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => openCancelDialog(booking.booking_id)}
                    >
                      <Trash size={16} className="mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                  
                  {booking.status !== "Booked" && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/view-restaurant/${booking.restaurant_id}`)}
                    >
                      View Restaurant
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={cancellingBooking}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={cancelBooking}
                disabled={cancellingBooking}
              >
                {cancellingBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
