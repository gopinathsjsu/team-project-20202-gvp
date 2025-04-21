"use client";
import { Form } from "@/components/form"
import { PublicRoute } from "@/components/PublicRoute"

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Form type="login" role="Customer"/>
        </div>
      </div>
    </PublicRoute>
  )
}
