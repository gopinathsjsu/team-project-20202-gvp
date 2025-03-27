// components/Navbar.tsx
"use client";
import { useState } from "react";
import { Search, Users, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import DateSelector from "./DateSelector";
import { usePathname } from "next/navigation";

interface SearchState {
  location: string;
  date: Date;
  time: string;
  people: number;
  searchQuery: string;
}

const Navbar = () => {
  const [location, setLocation] = useState("San Jose");
  const pathname = usePathname();
  const currentPage = pathname.split("/").pop();
  console.log(currentPage);

  const [searchState, setSearchState] = useState<SearchState>({
    location: "San Jose",
    date: new Date(),
    time: "7:00 PM",
    people: 2,
    searchQuery: "",
  });

  const [isPeopleDropdownOpen, setIsPeopleDropdownOpen] = useState(false);

  const handlePeopleSelect = (count: number) => {
    setSearchState({
      ...searchState,
      people: count,
    });
    setIsPeopleDropdownOpen(false);
  };

  const peopleOptions = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="w-full bg-slate-950 text-slate-100">
      {/* Top navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo and location */}
        <div className="flex items-center space-x-6">
          <Link href="/">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-slate-950 rounded-full"></div>
              </div>
              <span className="ml-2 font-bold text-lg">DineTable</span>
            </div>
          </Link>

          <button
            className="flex items-center text-slate-300 hover:text-slate-400"
            onClick={() => setLocation("New Location")}
          >
            <MapPin className="w-4 h-4 mr-1" />
            <span>{location}</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-2">
          {currentPage === "" && (
            <Link href="/login">
              <button className="px-4 py-2 text-slate-100 hover:text-slate-200 hover:cursor-pointer">
                Sign in
              </button>
            </Link>
          )}
          <button className="p-2" aria-label="Search">
            <Search className="w-5 h-5 text-slate-100 hover:text-slate-200" />
          </button>
        </div>
      </div>

      {/* Search bar section */}
      {currentPage === "" && (
        <div className="border-t border-slate-800 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <DateSelector
                searchState={searchState}
                setSearchState={setSearchState}
              ></DateSelector>

              <div className="w-full sm:w-auto flex-shrink-0">
                <button className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md flex items-center justify-between border border-slate-700">
                  <div className="flex items-center">
                    <span className="text-slate-500">7:00 PM</span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
              </div>

              {/* Selecting number of people */}
              <div className="w-full sm:w-auto flex-shrink-0 relative">
                {/* Button to show selected people */}
                <button
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md flex items-center justify-between border border-slate-700"
                  onClick={() => setIsPeopleDropdownOpen(!isPeopleDropdownOpen)}
                >
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-slate-500" />
                    <span>
                      {searchState.people}{" "}
                      {searchState.people === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>

                {/* Dropdown menu  to select people*/}
                {isPeopleDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {peopleOptions.map((count) => (
                      <div
                        key={count}
                        className="px-4 py-2 hover:bg-slate-700 cursor-pointer"
                        onClick={() => handlePeopleSelect(count)}
                      >
                        {count} {count === 1 ? "person" : "people"}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Searching */}
              <div className="w-full flex-grow">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Location, Restaurant, or Cuisine"
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 px-10 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium px-6 py-2 rounded-md">
                Go
              </button>
            </div>

            <div className="mt-3 text-sm text-slate-400 flex justify-center sm:justify-start items-center">
              <span>It looks like you are in {location}. Not correct?</span>
              <button className="flex items-center ml-2 text-slate-500 hover:text-slate-400">
                <MapPin className="w-4 h-4 mr-1" />
                Get current location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
