"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/config";
import Image from "next/image";

// Google Maps specific types
interface GoogleMapMouseEvent {
  latLng: {
    lat: () => number;
    lng: () => number;
  };
}

interface GoogleMap {
  addListener: (event: string, callback: (e: GoogleMapMouseEvent) => void) => void;
}

// Restaurant photo interface
interface ExistingPhoto {
  photo_url: string;
  caption?: string;
  toDelete?: boolean;
}

// Restaurant form interface
interface RestaurantForm {
  // Basic Info
  name: string;
  cuisine_type: string;
  cost_rating: number;
  description: string;
  
  // Contact & Address
  address: string;
  city: string;
  state: string;
  zipcode: string;
  contact_info: string;
  
  // Operating Hours
  opening_time: string;
  closing_time: string;
  days_open: string[];
  
  // Seating Info
  table_sizes: string[];
  
  // Location & Photos
  location: { lat: number; lng: number } | null;
  photos: File[];
  existingPhotos: ExistingPhoto[];
}

declare global {
  interface Window {
    initMap: () => void;
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

// Function to format time for HTML time input
const formatTimeForInput = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // If it's already in HH:MM format, return it
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    // Remove seconds if present
    return timeStr.substring(0, 5);
  }
  
  // Try to parse time in various formats
  try {
    // Parse time like "2:30 PM" or "14:30"
    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = timeParts[2];
      const period = timeParts[3]?.toUpperCase();
      
      // Convert to 24-hour format if needed
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Format as HH:MM
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  } catch (error) {
    console.error("Error parsing time:", error);
  }
  
  return '';
};

export default function EditRestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurant_id as string;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<RestaurantForm>({
    name: "",
    cuisine_type: "",
    cost_rating: 0,
    description: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    contact_info: "",
    opening_time: "",
    closing_time: "",
    days_open: [],
    table_sizes: [],
    location: null,
    photos: [],
    existingPhotos: []
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { tokens } = useAuth();
  
  // Maps API key
  const googleMapsApiKey = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
  
  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`restaurants/${restaurantId}/`), {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const restaurantData = await response.json();
        
        // Log the response for debugging
        console.log("Restaurant data received:", restaurantData);
        
        // Set form data with fetched restaurant data
        setFormData({
          name: restaurantData.name || "",
          cuisine_type: restaurantData.cuisine_type || "",
          cost_rating: restaurantData.cost_rating || 0,
          description: restaurantData.description || "",
          address: restaurantData.address || "",
          city: restaurantData.city || "",
          state: restaurantData.state || "",
          // Make sure to handle potential field name differences
          zipcode: restaurantData.zip || "",
          contact_info: restaurantData.contact_info || "",
          // Format time values properly for HTML time inputs
          opening_time: formatTimeForInput(restaurantData.opening_time || ""),
          closing_time: formatTimeForInput(restaurantData.closing_time || ""),
          // Handle days_open which should now be available directly from the API
          days_open: Array.isArray(restaurantData.days_open) 
            ? restaurantData.days_open 
            : [],
          table_sizes: Array.isArray(restaurantData.table_sizes) 
            ? restaurantData.table_sizes 
            : typeof restaurantData.table_sizes === 'string'
              ? restaurantData.table_sizes.split(',').map((size: string) => size.trim())
              : [],
          location: restaurantData.latitude && restaurantData.longitude ? {
            lat: parseFloat(restaurantData.latitude),
            lng: parseFloat(restaurantData.longitude)
          } : null,
          photos: [],
          existingPhotos: restaurantData.photos ? restaurantData.photos.map((url: string) => ({ photo_url: url })) : []
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch restaurant data:", error);
        setLoading(false);
      }
    };
    
    if (restaurantId && tokens?.access) {
      fetchRestaurantData();
    }
  }, [restaurantId, tokens?.access]);
  
  // Add API key warning if needed
  useEffect(() => {
    if (step === 3 && !googleMapsApiKey) {
      setMapError("Google Maps API key is missing. Add a valid API key to your environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).");
      console.warn("Missing Google Maps API Key. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file");
    }
  }, [step, googleMapsApiKey]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle Google Maps location selection
  const handleMapClick = (e: GoogleMapMouseEvent) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setFormData(prev => ({
      ...prev,
      location: { lat, lng }
    }));
  };
  
  // Map initialization function
  const initMap = () => {
    if (!mapRef.current || step !== 3) return;
    
    try {
      if (!window.google || !window.google.maps) {
        setMapError("Google Maps failed to load. Please check your API key.");
        return;
      }
      
      const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco
      
      const map = new window.google.maps.Map(
        mapRef.current,
        {
          zoom: 13,
          center: formData.location || defaultLocation,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }
      );
      
      const marker = new window.google.maps.Marker({
        position: formData.location || defaultLocation,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      
      // Add click event listener
      map.addListener("click", (e: GoogleMapMouseEvent) => {
        marker.setPosition(e.latLng);
        handleMapClick(e);
      });
      
      // Add drag event listener
      marker.addListener("dragend", (e: GoogleMapMouseEvent) => {
        handleMapClick(e);
      });
      
      setMapError(null);
    } catch (error) {
      console.error("Google Maps error:", error);
      setMapError("Failed to initialize Google Maps.");
    }
  };
  
  // Add initMap to window for Google Maps callback
  if (typeof window !== "undefined") {
    window.initMap = initMap;
  }
  
  // Handle Google Maps script loading
  const handleMapsLoaded = () => {
    setMapsLoaded(true);
    
    if (step === 3 && typeof window.google !== 'undefined') {
      setTimeout(initMap, 100);
    }
  };
  
  // Initialize map when step changes to 3 and maps are loaded
  useEffect(() => {
    if (step === 3 && mapsLoaded && typeof window.google !== 'undefined') {
      initMap();
    }
  }, [step, mapsLoaded, formData.location]);
  
  // Go to next step
  const nextStep = () => {
    setStep(prev => prev + 1);
  };
  
  // Go to previous step
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Handle photo upload for new photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...filesArray]
      }));
    }
  };
  
  // Handle deletion of a new photo
  const handleDeleteNewPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };
  
  // Handle toggling deletion of an existing photo
  const handleToggleExistingPhoto = (index: number) => {
    setFormData((prev) => {
      const updatedPhotos = [...prev.existingPhotos];
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        toDelete: !updatedPhotos[index].toDelete
      };
      return {
        ...prev,
        existingPhotos: updatedPhotos
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate location data
    if (!formData.location) {
      setMapError("Please select a location on the map");
      return;
    }
    
    try {
      // Create a FormData instance to handle file uploads
      const formDataToSend = new FormData();
      
      // Add restaurant ID
      formDataToSend.append('restaurant_id', restaurantId);
      
      // Add basic info
      formDataToSend.append('name', formData.name);
      formDataToSend.append('cuisine_type', formData.cuisine_type);
      formDataToSend.append('cost_rating', formData.cost_rating.toString());
      formDataToSend.append('description', formData.description);
      
      // Add contact & address info
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('zipcode', formData.zipcode);
      formDataToSend.append('contact_info', formData.contact_info);
      
      // Add hours & days
      formDataToSend.append('opening_time', formData.opening_time);
      formDataToSend.append('closing_time', formData.closing_time);
      formData.days_open.forEach(day => {
        formDataToSend.append('days_open', day);
      });
      
      // Add location data as separate keys (not as a location object)
      if (formData.location) {
        formDataToSend.append('location_lat', formData.location.lat.toString());
        formDataToSend.append('location_lng', formData.location.lng.toString());
      }
      
      // Add new photos directly
      formData.photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });
      
      // Filter and add existing photos that should be kept (not marked for deletion)
      // We'll need to fetch them as binary data first
      const existingPhotosToKeep = formData.existingPhotos.filter(photo => !photo.toDelete);
      
      // We need to use Promise.all to wait for all downloads to complete
      const downloadPromises = existingPhotosToKeep.map(async (photo) => {
        try {
          // Fetch the image as a blob
          const response = await fetch(photo.photo_url);
          const blob = await response.blob();
          
          // Create a file from the blob with a proper filename
          const filename = photo.photo_url.split('/').pop() || `existing-photo-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type });
          
          // Add the file to FormData
          formDataToSend.append('photos', file);
        } catch (error) {
          console.error(`Failed to download existing photo: ${photo.photo_url}`, error);
        }
      });
      
      // Wait for all downloads to complete before submitting
      await Promise.all(downloadPromises);
      
      const response = await fetch(getApiUrl(`restaurants/update/`), {
        method: 'PUT',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${tokens?.access}`
          // Don't set 'Content-Type' header, the browser will set it with the correct boundary for FormData
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Restaurant updated successfully:", result);
      alert("Restaurant information updated successfully!");
      router.push('/partner/dashboard');
    } catch (error) {
      console.error("Failed to update restaurant data:", error);
      alert("Failed to update restaurant data. Please try again.");
    }
  };
  
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
          <div>Loading restaurant data...</div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 min-h-screen">
        {/* Google Maps Script - Only load if API key is available */}
        {googleMapsApiKey && (
          <Script
            id="google-maps"
            strategy="afterInteractive"
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`}
            onLoad={handleMapsLoaded}
          />
        )}
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold">Edit Restaurant Information</h1>
          <p className="text-red-500 text-xl mt-1">Update your restaurant details</p>
          <p className="mt-4 text-muted-foreground">
            Make changes to your restaurant information.
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-3 items-center">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <button
                  onClick={() => stepNumber < step && setStep(stepNumber)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === stepNumber 
                      ? "bg-red-900 text-white" 
                      : step > stepNumber 
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-600"
                  )}
                >
                  {stepNumber}
                </button>
                {stepNumber < 5 && (
                  <div 
                    className={cn(
                      "w-10 h-0.5 mx-1", 
                      step > stepNumber ? "bg-green-700" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle>
                  {step === 1 && "Basic Restaurant Information"}
                  {step === 2 && "Contact & Location"}
                  {step === 3 && "Map Location"}
                  {step === 4 && "Restaurant Photos"}
                  {step === 5 && "Review & Submit"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Update information about your restaurant"}
                  {step === 2 && "Update contact and location details"}
                  {step === 3 && "Update your location on the map"}
                  {step === 4 && "Update your restaurant photos"}
                  {step === 5 && "Review and submit your changes"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Basic Information */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor="name">Restaurant Name*</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter your restaurant name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="cuisine_type">Cuisine Type*</Label>
                        <Input
                          id="cuisine_type"
                          name="cuisine_type"
                          placeholder="Italian, Indian, Chinese, etc."
                          value={formData.cuisine_type}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="cost_rating">Cost Rating (1-5)*</Label>
                        <Input
                          id="cost_rating"
                          name="cost_rating"
                          type="number"
                          min="1"
                          max="5"
                          placeholder="3"
                          value={formData.cost_rating}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="description">Description*</Label>
                        <textarea
                          id="description"
                          name="description"
                          className="border rounded-md p-2 h-32 focus:outline-none focus:ring-2 focus:ring-red-900"
                          placeholder="Tell us about your restaurant"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Contact & Location */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor="address">Street Address*</Label>
                        <Input
                          id="address"
                          name="address"
                          placeholder="123 Restaurant Ave"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="city">City*</Label>
                          <Input
                            id="city"
                            name="city"
                            placeholder="San Jose"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-3">
                          <Label htmlFor="state">State*</Label>
                          <Input
                            id="state"
                            name="state"
                            placeholder="California"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-3">
                          <Label htmlFor="zipcode">Zipcode*</Label>
                          <Input
                            id="zipcode"
                            name="zipcode"
                            placeholder="95112"
                            value={formData.zipcode}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="contact_info">Contact Information*</Label>
                        <Input
                          id="contact_info"
                          name="contact_info"
                          placeholder="Phone number, email"
                          value={formData.contact_info}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="opening_time">Opening Time*</Label>
                          <Input
                            id="opening_time"
                            name="opening_time"
                            type="time"
                            value={formData.opening_time}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-3">
                          <Label htmlFor="closing_time">Closing Time*</Label>
                          <Input
                            id="closing_time"
                            name="closing_time"
                            type="time"
                            value={formData.closing_time}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label>Days Open*</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                            // Normalize day names for more reliable comparison
                            const dayLower = day.toLowerCase();
                            const isDayIncluded = formData.days_open.some(d => 
                              d.toLowerCase() === dayLower || 
                              d.toLowerCase() === dayLower.substring(0, 3) ||  // Handle Mon, Tue, etc.
                              dayLower.includes(d.toLowerCase())  // Handle other variations
                            );
                            
                            return (
                              <div key={day} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`day-${day}`}
                                  checked={isDayIncluded}
                                  onChange={() => {
                                    setFormData((prev) => {
                                      // Remove all variations of this day name
                                      const filteredDays = prev.days_open.filter(d => 
                                        !d.toLowerCase().includes(dayLower.substring(0, 3)) && 
                                        !dayLower.includes(d.toLowerCase())
                                      );
                                      
                                      const updatedDays = isDayIncluded
                                        ? filteredDays
                                        : [...filteredDays, day]; // Always add with consistent format
                                      
                                      return {
                                        ...prev,
                                        days_open: updatedDays
                                      };
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-red-900 focus:ring-red-900"
                                />
                                <label htmlFor={`day-${day}`}>{day}</label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Map Location */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <Label>Location on Map*</Label>
                        <p className="text-sm text-muted-foreground">Click or drag the marker to update your restaurant&apos;s exact location</p>
                        <div 
                          id="map" 
                          ref={mapRef}
                          style={{ width: "100%", height: "400px", borderRadius: "0.5rem" }} 
                          className="border" 
                        />
                        {mapError && (
                          <div className="mt-2 p-3 border border-red-300 bg-red-50 rounded-md">
                            <p className="text-sm text-red-500 mb-2">{mapError}</p>
                            <p className="text-sm text-gray-700 mb-2">You can manually enter coordinates below:</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                  id="lat"
                                  type="number"
                                  step="0.000001"
                                  placeholder="37.7749"
                                  value={formData.location?.lat || ""}
                                  onChange={(e) => {
                                    const lat = parseFloat(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      location: {
                                        lat: isNaN(lat) ? 0 : lat,
                                        lng: prev.location?.lng || 0
                                      }
                                    }));
                                  }}
                                />
                              </div>
                              <div>
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                  id="lng"
                                  type="number"
                                  step="0.000001"
                                  placeholder="-122.4194"
                                  value={formData.location?.lng || ""}
                                  onChange={(e) => {
                                    const lng = parseFloat(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      location: {
                                        lat: prev.location?.lat || 0,
                                        lng: isNaN(lng) ? 0 : lng
                                      }
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {formData.location && !mapError && (
                          <p className="text-sm mt-1">
                            Selected location: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 4: Restaurant Photos */}
                  {step === 4 && (
                    <div className="space-y-4">
                      {/* Existing Photos Section */}
                      {formData.existingPhotos.length > 0 && (
                        <div className="grid gap-3">
                          <Label>Existing Photos</Label>
                          <p className="text-sm text-muted-foreground">These photos are currently associated with your restaurant.</p>
                          <p className="text-sm text-amber-600 font-medium">To delete a photo, click on it to mark for deletion (photos are only removed after you submit the form).</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {formData.existingPhotos.map((photo, index) => (
                              <div 
                                key={index} 
                                className={cn(
                                  "relative h-40 rounded-md overflow-hidden cursor-pointer border-2",
                                  photo.toDelete ? "border-red-500 opacity-50" : "border-transparent hover:border-blue-300"
                                )}
                                onClick={() => handleToggleExistingPhoto(index)}
                              >
                                <Image
                                  src={photo.photo_url}
                                  alt={`Restaurant photo ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                {photo.toDelete && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20">
                                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">Marked for deletion</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* New Photos Section */}
                      <div className="grid gap-3 mt-6">
                        <Label htmlFor="new-photos">Upload New Photos</Label>
                        <p className="text-sm text-muted-foreground">Add new high-quality photos of your restaurant, food, and ambiance</p>
                        <p className="text-xs text-amber-600 font-medium">Note: Only PNG, JPEG, and JPG file formats are accepted.</p>
                        <Input
                          id="new-photos"
                          name="new-photos"
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handlePhotoUpload}
                          className="py-2"
                        />
                        
                        {/* Display new photos */}
                        {formData.photos.length > 0 && (
                          <div className="mt-4">
                            <p>New photos to upload: {formData.photos.length}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                              {Array.from(formData.photos).map((photo, index) => (
                                <div key={index} className="relative h-40 rounded-md overflow-hidden group">
                                  <Image
                                    src={URL.createObjectURL(photo)}
                                    alt={`New restaurant photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNewPhoto(index)}
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete photo"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 6L6 18M6 6l12 12"></path>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 5: Review & Submit */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <h3 className="text-lg font-semibold">Review your changes</h3>
                        <div className="border rounded-md p-4 divide-y">
                          {/* Existing review fields */}
                          <div className="py-2">
                            <p className="font-medium">Restaurant Name:</p>
                            <p>{formData.name}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Cuisine Type:</p>
                            <p>{formData.cuisine_type}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Cost Rating:</p>
                            <p>{formData.cost_rating}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Description:</p>
                            <p>{formData.description}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Address:</p>
                            <p>{formData.address}, {formData.city}, {formData.state} {formData.zipcode}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Contact Info:</p>
                            <p>{formData.contact_info}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Opening Time:</p>
                            <p>{formData.opening_time}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Closing Time:</p>
                            <p>{formData.closing_time}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Days Open:</p>
                            <p>{formData.days_open.join(", ")}</p>
                          </div>
                          <div className="py-2">
                            <p className="font-medium">Location (Lat, Lng):</p>
                            <p>{formData.location ? `${formData.location.lat.toFixed(6)}, ${formData.location.lng.toFixed(6)}` : 'Not set'}</p>
                          </div>
                          
                          {/* Photo review section */}
                          <div className="py-2">
                            <p className="font-medium">Photos:</p>
                            <p>{formData.existingPhotos.filter(p => !p.toDelete).length} existing photos kept, {formData.existingPhotos.filter(p => p.toDelete).length} marked for deletion, {formData.photos.length} new photos to upload</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-3 mt-6">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="confirm"
                            required
                            className="h-4 w-4 mt-1 rounded border-gray-300 text-red-900 focus:ring-red-900"
                          />
                          <label htmlFor="confirm" className="text-sm">
                            I confirm that the information provided is accurate and I want to update my restaurant details.
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                    ) : (
                      <div></div>
                    )}
                    
                    {step < 5 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                      >
                        Update Restaurant
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
