"use client";
import Restaurants from "@/components/Restaurants";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  if (user?.role === "Admin") {
    router.push("/admin");
  } else if (user?.role === "RestaurantManager") {
    router.push("/partner/dashboard");
  }
  return (
  
      <Restaurants/>
    
      

     
    
  );
}
