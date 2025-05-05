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
        "https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b?q=80&w=2089&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://lh3.googleusercontent.com/gps-cs-s/AC9h4npxeQTE7WnaPRuB5BG9BwsyUcwCDEyyQNJmneqly62MvcD7TRywrrQEfvlTX8uYVWShVLf44-OvtxxbbC97cVzj4SUtHqaAI854Zm_q499ooX0taD6chEiBSw5gExb4v-frmCJ2vw=s680-w680-h510-rw",
        "https://content3.jdmagicbox.com/comp/ahmedabad/x4/079pxx79.xx79.131028205111.b8x4/catalogue/shreeji-krupa-bombay-vada-pav-vastrapur-ahmedabad-home-delivery-restaurants-2i395nz.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4yyGRfkehXY-GdqYKJ_wnZarP4gcmJkN4XA&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYpxejCK5DvBS1uwnaNo3PSx9gOfifObAIkw&s"
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