import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X } from "lucide-react";

export default function Navbar() {
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("San Jose");
  const [searchQuery, setSearchQuery] = useState("");
  
  const locations = [
    "San Jose", 
    "Sunny Vale", 
    "Mountain View", 
    "Palo Alto", 
    "Cupertino"
  ];
  
  const filteredLocations = locations.filter(location => 
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (location : string) => {
    setSelectedLocation(location);
    setIsLocationPopupOpen(false);
    setSearchQuery("");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between bg-[#f8fbc6] px-6 py-3 shadow-md rounded-bl-lg rounded-br-lg">
      {/* Brand Name */}
      <h2 className="text-black font-bold text-xl px-4 py-2 rounded-xl italic">
        Romato
      </h2>

      {/* Search and Location Bar */}
      <div className="flex items-center bg-[#c0c58f] px-3 py-2 rounded-xl space-x-2 w-1/2 sm:w-full md:w-1/2 relative">
        {/* Custom Location Selector */}
        <div 
          className="flex items-center gap-1 text-black cursor-pointer w-1/3 hidden sm:flex"
          onClick={() => setIsLocationPopupOpen(true)}
        >
          <MapPin size={16} />
          <span className="truncate">{selectedLocation}</span>
        </div>

        <span className="border-l border-neutral-400 h-5 hidden sm:block"></span>

        {/* Input Field for Searching Restaurants */}
        <input
          type="text"
          placeholder="Search restaurants"
          className="bg-transparent text-black outline-none placeholder:text-black w-2/3"
        />

        {/* Search Icon */}
        <Search className="text-black" size={18} />
        
        {/* Custom Location Popup */}
        {isLocationPopupOpen && (
          <div className="bg-neutral-950 text-white border p-1 absolute top-12  left-0 rounded-lg shadow-lg py-0 px-4 w-64 z-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Select your location</h3>
              <button 
                onClick={() => setIsLocationPopupOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="mb-3">
              <input 
                type="text"
                placeholder="Search location..." 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredLocations.map((location) => (
                <div
                  key={location}
                  className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
                    selectedLocation === location ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleLocationSelect(location)}
                >
                  {location}
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center text-green-600 cursor-pointer">
                <MapPin size={16} className="mr-1" />
                <span>Detect current location</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          variant="ghost"
          className="text-black py-3 px-6 hover:bg-black hover:text-white text-lg hover:cursor-pointer"
        >
          Add Restaurant
        </Button>
        <Button
          variant="ghost"
          className="text-black py-3 px-6 hover:bg-black hover:text-white text-lg hover:cursor-pointer"
        >
          Login
        </Button>
        <Button
          variant="ghost"
          className="text-black py-3 px-6 hover:bg-black hover:text-white text-lg hover:cursor-pointer"
        >
          Signup
        </Button>
      </div>
    </nav>
  );
}