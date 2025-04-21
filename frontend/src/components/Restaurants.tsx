"use client";
import RestaurantCard from "./RestaurantCard";
import { useRestaurant } from "@/context/RestaurantContext";

export default function Restaurants() {
    const { restaurants, isLoading, error } = useRestaurant();
    
    if (isLoading) {
        return <div className="w-3/4 h-full m-auto text-center">Loading restaurants...</div>;
    }

    if (error) {
        return <div className="w-3/4 h-full m-auto text-center text-red-500">Error: {error}</div>;
    }
    
    return (
        <div className="w-3/4 h-full m-auto place-items-center gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {
                restaurants.map((restaurant)=>(<RestaurantCard key={restaurant.id} name={restaurant.name} imageURL={restaurant.imageURL} cuisine={restaurant.cuisine} rating={restaurant.rating} ratePerPerson={restaurant.ratePerPerson} />))
            }
        </div>
    )
}   