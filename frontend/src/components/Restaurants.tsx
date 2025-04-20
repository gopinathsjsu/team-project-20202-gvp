import RestaurantCard from "./RestaurantCard";

export default function Restaurants() {

    const restaurants = [
        {name: "Restaurant 1", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        {name: "Restaurant 2", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        {name: "Restaurant 3", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        {name: "Restaurant 4", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        {name: "Restaurant 5", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        {name: "Restaurant 6", imageURL: "/restaurant.jpg", cuisine: "Italian", rating: 4.5, ratePerPerson: 100},
        
    ] 

    return (
        <div className="w-3/4 h-full m-auto place-items-center gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {
                restaurants.map((restaurant, index)=>(<RestaurantCard key={index} name={restaurant.name} imageURL={restaurant.imageURL} cuisine={restaurant.cuisine} rating={restaurant.rating} ratePerPerson={restaurant.ratePerPerson} />))
            }
        </div>
    )

}   