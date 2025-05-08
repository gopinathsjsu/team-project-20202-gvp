"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
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

// Restaurant registration form interface
interface RestaurantForm {
  // Basic Info
  name: string;
  cuisine_type: string;
  cost_rating: string;
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
//   available_booking_times: string[];
  
  // Seating Info
  table_sizes: string[];
  
  // Location & Photos
  location: { lat: number; lng: number } | null;
  photos: File[];
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

export default function AddNewRestaurantPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RestaurantForm>({
    name: "",
    cuisine_type: "",
    cost_rating: "",
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
    photos: []
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { user ,tokens} = useAuth();
  const router = useRouter();
  // Maps API key and loading state
  const googleMapsApiKey = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
  
  // Add API key warning if needed
  useEffect(() => {
    if (step === 3 && !googleMapsApiKey) {
      setMapError("Google Maps API key is missing. Add a valid API key to your environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).");
      console.warn("Missing Google Maps API Key. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file");
    }
  }, [step, googleMapsApiKey]);
  
  // Log API key presence (without revealing the actual key)
  useEffect(() => {
    console.log(user)
    console.log(tokens)
    if (step === 3) {
      console.log("API Key available:", !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }
  }, [step]);
  
  // Days of the week options
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Common table sizes
  const commonTableSizes = ["2", "4", "6", "8", "10"];
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox changes for days open
  const handleDayChange = (day: string) => {
    setFormData((prev) => {
      const updatedDays = prev.days_open.includes(day)
        ? prev.days_open.filter(d => d !== day)
        : [...prev.days_open, day];
        
      return {
        ...prev,
        days_open: updatedDays
      };
    });
  };
  
  // Handle checkbox changes for table sizes
  const handleTableSizeChange = (size: string) => {
    setFormData((prev) => {
      const updatedSizes = prev.table_sizes.includes(size)
        ? prev.table_sizes.filter(s => s !== size)
        : [...prev.table_sizes, size];
        
      return {
        ...prev,
        table_sizes: updatedSizes
      };
    });
  };
  
  // Handle file upload for photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...filesArray]
      }));
    }
  };
  
  // Handle photo deletion
  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
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
    // Only initialize map when the map div exists and we're on step 3
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
    
    // Try to initialize map immediately after script loads
    if (step === 3 && typeof window.google !== 'undefined') {
      setTimeout(initMap, 100); // Small delay to ensure DOM is ready
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData)
    
    // Validate location data on final submission if on step 4
    if (step === 4 && !formData.location) {
      alert("Please go back and set your restaurant's location before submitting.");
      return;
    }
    
    // Create a FormData object for multipart/form-data submission
    const formDataToSend = new FormData();
    
    // Add all text fields
    if (user?.user_id) {
      formDataToSend.append('manager_id', user.user_id);
    }
    formDataToSend.append('name', formData.name);
    formDataToSend.append('cuisine_type', formData.cuisine_type);
    formDataToSend.append('cost_rating', formData.cost_rating);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('state', formData.state);
    formDataToSend.append('zipcode', formData.zipcode);
    formDataToSend.append('contact_info', formData.contact_info);
    formDataToSend.append('opening_time', formData.opening_time);
    formDataToSend.append('closing_time', formData.closing_time);
    
    // Add array fields
    formData.days_open.forEach(day => {
      formDataToSend.append('days_open', day);
    });
    
    formData.table_sizes.forEach(size => {
      formDataToSend.append('table_sizes', size);
    });
    
    // Add location data
    if (formData.location) {
      formDataToSend.append('location_lat', formData.location.lat.toString());
      formDataToSend.append('location_lng', formData.location.lng.toString());
    }
    
    // Add photo files
    formData.photos.forEach(photo => {
      formDataToSend.append('photos', photo);
    });
    
    try {
      const response = await fetch(getApiUrl('restaurants/create/'), {
        method: 'POST',
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
      console.log("Restaurant created successfully:", result);
      alert("Restaurant registration submitted successfully!");
      // Redirect to partner dashboard
      router.push("/partner/dashboard");
    } catch (error) {
      console.error("Failed to submit restaurant data:", error);
      alert("Failed to submit restaurant data. Please try again.");
    }
  };
  
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
            <h1 className="text-3xl font-bold">Join the Restaurant Partner Network</h1>
            <p className="text-red-500 text-xl mt-1">Partner with us</p>
            <p className="mt-4 text-muted-foreground">
            We&apos;re excited to hear from restaurants that want to integrate with our platform.
            Please complete the form below.
            </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
            <div className="flex space-x-3 items-center">
            {[1, 2, 3, 4].map((stepNumber) => (
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
                {stepNumber < 4 && (
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
                    {step === 2 && "Contact & Hours"}
                    {step === 3 && "Location & Seating"}
                    {step === 4 && "Photos & Final Details"}
                </CardTitle>
                <CardDescription>
                    {step === 1 && "Tell us about your restaurant"}
                    {step === 2 && "How can customers reach you?"}
                    {step === 3 && "Where are you located?"}
                    {step === 4 && "Almost done! Just add some photos"}
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
                        <Label htmlFor="cost_rating">Cost Rating*</Label>
                        <Input
                            id="cost_rating"
                            name="cost_rating"
                            placeholder="$30"
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
                    
                    {/* Step 2: Contact & Hours */}
                    {step === 2 && (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                        <Label htmlFor="address">Street Address*</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="123 Restaurant Ave"
                            value={formData.address }
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
                            <Label htmlFor="zipcode">zipcode*</Label>
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
                            {daysOfWeek.map(day => (
                            <div key={day} className="flex items-center space-x-2">
                                <input
                                type="checkbox"
                                id={`day-${day}`}
                                checked={formData.days_open.includes(day)}
                                onChange={() => handleDayChange(day)}
                                className="h-4 w-4 rounded border-gray-300 text-red-900 focus:ring-red-900"
                                />
                                <label htmlFor={`day-${day}`}>{day}</label>
                            </div>
                            ))}
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Step 3: Location & Seating */}
                    {step === 3 && (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                        <Label>Location on Map*</Label>
                        <p className="text-sm text-muted-foreground">Click or drag the marker to set your restaurant&apos;s exact location</p>
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
                            <p className="text-xs text-gray-500 mt-3">
                                Note: You can still proceed with the form after entering coordinates manually.
                            </p>
                            </div>
                        )}
                        {formData.location && !mapError && (
                            <p className="text-sm mt-1">
                            Selected location: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                            </p>
                        )}
                        </div>
                        
                        <div className="grid gap-3">
                        <Label>Table Sizes Available*</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {commonTableSizes.map(size => (
                            <div key={size} className="flex items-center space-x-2">
                                <input
                                type="checkbox"
                                id={`size-${size}`}
                                checked={formData.table_sizes.includes(size)}
                                onChange={() => handleTableSizeChange(size)}
                                className="h-4 w-4 rounded border-gray-300 text-red-900 focus:ring-red-900"
                                />
                                <label htmlFor={`size-${size}`}>{size} seats</label>
                            </div>
                            ))}
                        </div>
                        </div>
                        
                        
                    </div>
                    )}
                    
                    {/* Step 4: Photos & Final Details */}
                    {step === 4 && (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                        <Label htmlFor="photos">Restaurant Photos*</Label>
                        <p className="text-sm text-muted-foreground">Upload high-quality photos of your restaurant, food, and ambiance</p>
                        <p className="text-xs text-amber-600 font-medium">Note: Only PNG, JPEG, and JPG file formats are accepted.</p>
                        <Input
                            id="photos"
                            name="photos"
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handlePhotoUpload}
                            className="py-2"
                        />
                        
                        {formData.photos.length > 0 && (
                            <div className="mt-4">
                            <p>Selected photos: {formData.photos.length}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {Array.from(formData.photos).map((photo, index) => (
                                <div key={index} className="relative h-24 rounded-md overflow-hidden group">
                                    <Image
                                    src={URL.createObjectURL(photo)}
                                    alt={`Restaurant photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    />
                                    <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        
                        <div className="grid gap-3 mt-6">
                        <Label>Terms & Conditions</Label>
                        <div className="flex items-start space-x-2">
                            <input
                            type="checkbox"
                            id="terms"
                            required
                            className="h-4 w-4 mt-1 rounded border-gray-300 text-red-900 focus:ring-red-900"
                            />
                            <label htmlFor="terms" className="text-sm">
                            By submitting this form, I agree to the Terms of Service and Privacy Policy and confirm that all information provided is accurate.
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
                    
                    {step < 4 ? (
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
                        Submit
                        </Button>
                    )}
                    </div>
                </form>
                </CardContent>
            </Card>
            
            <div className="mt-6 text-center text-xs text-muted-foreground">
                By proceeding, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
            </div>
            </div>
        </div>
        </div>
    </ProtectedRoute>
  );
}
