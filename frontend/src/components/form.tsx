"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React, { useState } from "react";

import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";

interface SignUp{
  email: string, 
  username: string,
  password: string,
  rePassword: string
}

export function Form({
  className,
  type,
  role,
  ...props
}: React.ComponentProps<"div"> & {type:string,role:string}) {
  const router = useRouter();
  const { login, signup } = useAuth();

  const typeLS: string = (type==="login"?"Login":"Signup")

  const [formState, setFormState]  = useState<SignUp>({
    email:"",
    password: "",
    username:"",
    rePassword: "",

  })
  const [error, setError] = useState<string | null>(null);

  const handleFormChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    
    setFormState((prev)=>({
      ...prev,
      [e.target.name]:e.target.value
    }))
    // console.log(formState)

  }
  const handleFormSubmit = async (e:React.FormEvent)=>{
    e.preventDefault();
    if (type === "signup") {
      // Check if passwords match for signup
      if (formState.password !== formState.rePassword) {
        setError("Passwords do not match");
        setFormState((prev)=>({
          ...prev,
          password: "",
          rePassword: "",
        }))
        return;
      }
    }
    console.log(role)
    
    // Clear any previous errors if validation passes
    setError(null);

    try {
      if (type === "login") {
        await login(formState.username, formState.password);
      } else {
        await signup({
          username: formState.username,
          password: formState.password,
          email: formState.email,
          role: role
        });
      }
      
      // Debug - log auth state
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User after auth:", user);
      console.log("Role from props:", role);
      console.log("User role from auth:", user.role);
      
      // Force immediate navigation based on role without waiting for PublicRoute redirects
      if (role === "Admin") {
        console.log("In Admin - forcing navigation");
        router.replace('/admin');
      } else if(role === "RestaurantManager") {
        console.log("In Manager - forcing navigation");
        // Use replace option to prevent back navigation issues
        router.replace('/partner/dashboard');
      } else if(role === "Customer" ) {
        console.log("In Customer - forcing navigation");
        router.replace('/');
      }
    } catch (error: Error | unknown) {
      // Handle authentication errors
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Authentication failed");
      }
    }
  }

 

  return (
  
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{type==="login"?"Welcome Back": "Join With Us" }</CardTitle>
          <CardDescription>
            {typeLS} with your Email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-6">
              
              <div className="grid gap-6">
                {type!="login" &&
                  (
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="roy@google.com"
                        required
                        value={formState.email}
                        onChange={handleFormChange}
                      />
                    </div>
                  )
                }
                <div className="grid gap-3">
                  <Label htmlFor="email">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Roy@2002"
                    required
                    value={formState.username}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      {type ==="login" && "Forgot your password?"}
                    </a>
                  </div>
                  
                  <Input id="password"
                         name="password" 
                         type="password" 
                         required 
                         value= {formState.password} 
                         onChange={handleFormChange}
                         placeholder={type==="login"?"Enter your password":"Set a password"}/>
                </div>
                {
                  type === "signup" ? (
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">Re-enter password</Label>
                      </div>
                      <Input name="rePassword" 
                             id="rePassword" 
                             type="password" 
                             required  
                             value= {formState.rePassword} 
                             onChange={handleFormChange}
                             placeholder="Re enter your password"/>
                    </div>
                  ) : null
                }
                {error && (<p className="text-red-500 m-auto "> {error}</p>)}
                <Button type="submit" className="w-full">
                  {type==="login"?"Login":"Signup"}
                </Button>
              </div>

              {
                type=="login" ?
                  <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="underline underline-offset-4">
                      Sign Up
                    </Link>
                  </div>
              :
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline underline-offset-4">
                      Login 
                    </Link>
                  </div>
              }
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
