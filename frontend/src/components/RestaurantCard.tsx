import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RestaurantCard({restaurantID, imageURL, name, cuisine, rating, ratePerPerson}: {
    restaurantID: string,
    imageURL: string,
    name: string,
    cuisine: string, 
    rating: number, 
    ratePerPerson: number
}) {
    const router = useRouter();
    
    const handleClick = () => {
        router.push(`/view-restaurant/${restaurantID}`);
    };
    console.log(restaurantID)
    
    return (
        <div 
            onClick={handleClick}
            className="w-full max-w-sm bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer"
        >
            <div className="">
                <div className="relative w-full h-48 mb-2">
                    <Image src={imageURL} alt="Restaurant" fill className="object-cover rounded-t-lg " />
                </div>
                <h2 className="px-3 text-xl font-semibold text-slate-900 mb-2">{name}</h2>
                <div className="flex items-center justify-between px-4 pb-2">
                    <span className="text-sm text-slate-500">{cuisine} • ${ratePerPerson}</span>
                    <span className="text-sm text-slate-500">{rating} ★</span>
                </div>
            </div>
        </div>  
    )
}