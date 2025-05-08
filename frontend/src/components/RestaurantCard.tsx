import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo } from "react";

const RestaurantCard = ({restaurantID, imageURL, name, cuisine, rating, ratePerPerson}: {
    restaurantID: string,
    imageURL: string,
    name: string,
    cuisine: string, 
    rating: number, 
    ratePerPerson: number
}) => {
    const router = useRouter();
    
    const handleClick = () => {
        router.push(`/view-restaurant/${restaurantID}`);
    };
    const imageList =[
        "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?20210521171500"
    ];
    
    // Use a random image from imageList if imageURL is empty
    const displayImageURL : string  =  imageURL?.length === 0 ? imageList[Math.floor(Math.random() * imageList.length)]:imageURL;
    
    return (
        <div 
            onClick={handleClick}
            className="w-full max-w-sm bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer"
        >
            <div className="">
                <div className="relative w-full h-48 mb-2">
                    <Image src={displayImageURL} alt="Restaurant" fill className="object-cover rounded-t-lg " />
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

export default memo(RestaurantCard);