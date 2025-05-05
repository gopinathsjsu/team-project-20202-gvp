"use client";
import RestaurantCard from "./RestaurantCard";
import { useRestaurant } from "@/context/RestaurantContext";
import { useMemo } from "react";

export default function Restaurants() {
    const { restaurants, isLoading, error, pagination, nextPage, prevPage } = useRestaurant();
    
    // Memoize the restaurant cards to prevent unnecessary re-renders
    const restaurantCards = useMemo(() => {
        return restaurants.map((restaurant) => (
            <RestaurantCard 
                key={restaurant.id} 
                restaurantID={restaurant.id} 
                name={restaurant.name} 
                imageURL={restaurant.imageURL} 
                cuisine={restaurant.cuisine} 
                rating={restaurant.rating} 
                ratePerPerson={restaurant.ratePerPerson} 
            />
        ));
    }, [restaurants]);
    
    if (isLoading) {
        return <div className="w-3/4 h-full m-auto text-center">Loading restaurants...</div>;
    }

    if (error) {
        return <div className="w-3/4 h-full m-auto text-center text-red-500">Error: {error}</div>;
    }

    const hasPagination = pagination.totalPages > 1;
    const hasMorePages = pagination.page < pagination.totalPages;
    const showingText = restaurants.length > 0 
        ? `Showing ${restaurants.length} restaurants${pagination.totalItems ? ` of ${pagination.totalItems}` : ''}`
        : "No restaurants found";
    
    return (
        <div className="w-3/4 h-full m-auto">
            <div className="mb-4 text-gray-600 text-sm">
                {showingText}
            </div>
            
            <div className="place-items-center gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {
                    restaurants.length > 0 
                    ? restaurantCards
                    : <div className="col-span-full text-center py-8">No restaurants found matching your criteria.</div>
                }
            </div>
            
            {/* Pagination Controls */}
            {hasPagination && (
                <div className="flex justify-center mt-8 mb-4 space-x-4">
                    <button 
                        onClick={prevPage}
                        disabled={pagination.page <= 1}
                        className={`px-4 py-2 rounded-md ${pagination.page <= 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button 
                        onClick={nextPage}
                        disabled={!hasMorePages}
                        className={`px-4 py-2 rounded-md ${!hasMorePages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}   