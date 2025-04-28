"use client";
import { Form } from "@/components/form"
import { PublicRoute } from "@/app/partner/components/PublicRoute"

export default function SignUp() {
  return (
    <PublicRoute>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Form type="signup" role="RestaurantManager"/>
        </div>
      </div>
    </PublicRoute>
  )
} 