"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is authenticated and is a restaurant manager, redirect to partner dashboard
      if (user?.role === "RestaurantManager") {
        router.push("/partner/dashboard");
      } else {
        // Otherwise redirect to home (if this is a customer using partner routes)
        router.push("/");
      }
    }
  }, [isLoading, isAuthenticated, router, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-200"></div>
      </div>
    );
  }

  // If not authenticated, render children
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // This will not be rendered, as the useEffect will redirect
  return null;
} 