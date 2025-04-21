"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Restaurant {
  id: string;
  name: string;
  imageURL: string;
  cuisine: string;
  rating: number;
  ratePerPerson: number;
}

export interface SearchState {
  location: string;
  date: Date | undefined;
  time: string;
  people: number;
  searchQuery?: string;
}

interface RestaurantContextType {
  restaurants: Restaurant[];
  setRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  isLoading: boolean;
  error: string | null;
  searchForRestaurants: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {id:"1",name: "Restaurant 1", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
    {id:"2",name: "Restaurant 2", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
    {id:"3",name: "Restaurant 3", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
    {id:"4",name: "Restaurant 4", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
    {id:"5",name: "Restaurant 5", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
    {id:"6",name: "Restaurant 6", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
  ]);
  
  const [searchState, setSearchState] = useState<SearchState>({
    location: 'San Jose',
    date: undefined,
    time: '19:00',
    people: 1,
    searchQuery: '',
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchForRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Searching for restaurants with state:", searchState);
      
      // For GET requests with query parameters
      const params = new URLSearchParams({
        city: searchState.location,
        date: searchState.date ? new Date(searchState.date).toISOString().split('T')[0] : '',
        time: searchState.time,
        people: searchState.people.toString(),
      });
      console.log(params)
      
    //   if (searchState.searchQuery) {
    //     params.append('searchQuery', searchState.searchQuery);
    //   }
      
      const url = `http://192.168.1.115:8000/api/restaurants/search/?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      
      const data = await response.json();
      console.log(data)
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error searching for restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        setRestaurants,
        searchState,
        setSearchState,
        isLoading,
        error,
        searchForRestaurants,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};
