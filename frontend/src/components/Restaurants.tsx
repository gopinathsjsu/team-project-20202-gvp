"use client";
import { useEffect, useState } from "react";
import RestaurantCard from "./RestaurantCard";
import { useRestaurant } from "@/context/RestaurantContext";

export default function Restaurants() {
    const { restaurants, isLoading, error, fetchHotRestaurants, pagination } = useRestaurant();
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch hot restaurants on component mount and when page changes
    useEffect(() => {
        fetchHotRestaurants(currentPage, 12);
    }, [currentPage, fetchHotRestaurants]);
    
    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            // Scroll to top when changing page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isLoading && currentPage === 1) {
        return <div className="w-3/4 h-full m-auto text-center mt-8">Loading hot restaurants...</div>;
    }

    if (error) {
        return <div className="w-3/4 h-full m-auto text-center text-red-500 mt-8">Error: {error}</div>;
    }
    
    return (
        <div className="w-3/4 h-full m-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Hot Restaurants</h2>
            
            {/* Restaurant grid */}
            <div className="place-items-center gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
                {restaurants.map((restaurant) => (
                    <RestaurantCard 
                        key={restaurant.id} 
                        restaurantID={restaurant.id} 
                        name={restaurant.name} 
                        imageURL={restaurant.imageURL} 
                        cuisine={restaurant.cuisine} 
                        rating={restaurant.rating} 
                        ratePerPerson={restaurant.ratePerPerson}
                    />
                ))}
            </div>
            
            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 my-8">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    
                    <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            // Calculate which page numbers to show
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                                pageNum = i + 1; // Show pages 1-5 if we have 5 or fewer pages
                            } else if (currentPage <= 3) {
                                pageNum = i + 1; // Show pages 1-5 when we're near the start
                            } else if (currentPage >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i; // Show the last 5 pages when near the end
                            } else {
                                pageNum = currentPage - 2 + i; // Show 2 pages before and after current page
                            }
                            
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 flex items-center justify-center rounded ${
                                        pageNum === currentPage 
                                            ? 'bg-red-900 text-white' 
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        
                        {/* Add ellipsis if there are more pages than we're showing */}
                        {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                            <span className="flex items-center px-2">...</span>
                        )}
                        
                        {/* Always show the last page if we have more than 5 pages and aren't near the end */}
                        {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                            <button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                className="w-8 h-8 flex items-center justify-center rounded bg-gray-200"
                            >
                                {pagination.totalPages}
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
            
            {/* Show loading indicator when changing pages */}
            {isLoading && currentPage > 1 && (
                <div className="text-center my-4">Loading...</div>
            )}
        </div>
    );
}   