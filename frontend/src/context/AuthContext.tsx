"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/config";

// Define user interface based on your backend response
interface User {
  user_id?: string;
  username: string;
  email?: string;
  role?: string;
}

interface Tokens {
  access: string;
  refresh: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  signup: (userData: { username: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a stored user and token in localStorage
        const storedUser = localStorage.getItem("user");
        const storedTokens = localStorage.getItem("tokens");
        
        if (storedUser && storedTokens) {
          const user = JSON.parse(storedUser);
          const tokens = JSON.parse(storedTokens);
          
          // Verify the token is valid by trying to refresh it
          const isValid = await refreshTokenSilently(tokens.refresh);
          
          if (!isValid) {
            // Token is invalid, clear storage
            clearAuthStorage();
            setAuthState({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // Set user data from localStorage if token refresh was successful
            setAuthState(prev => ({
              ...prev,
              user: user,
              tokens: tokens,
              isAuthenticated: true,
              isLoading: false,
            }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthStorage();
        setAuthState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const refreshTokenSilently = async (refreshToken: string): Promise<boolean> => {
    try {
      // Implement token refresh logic here
      // This is a placeholder - you would call your API to refresh the token
      const response = await fetch(getApiUrl("token/refresh/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Get current user from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        // Update tokens in state and localStorage
        const newTokens = {
          access: data.access,
          refresh: refreshToken
        };
        
        // Update state with new tokens
        setAuthState(prev => ({
          ...prev,
          user: user,
          tokens: newTokens,
          isAuthenticated: true,
          isLoading: false,
        }));
        
        // Update localStorage
        localStorage.setItem("tokens", JSON.stringify(newTokens));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!authState.tokens?.refresh) return false;
    return await refreshTokenSilently(authState.tokens.refresh);
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokens");
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(getApiUrl("users/login/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      
      // Store user and tokens in state and localStorage
      setAuthState(()=>({
        user: data.user,
        tokens: data.tokens,
        isAuthenticated: true,
        isLoading: false,
      }));
      
      
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tokens", JSON.stringify(data.tokens));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (userData: { username: string; email: string; password: string; role: string }) => {
    try {
      const response = await fetch(getApiUrl("users/register/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(Object.values(error)[0] as string || "Signup failed");
      }

      // After successful signup, log the user in
      await login(userData.username, userData.password);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = () => {
    clearAuthStorage();
    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 