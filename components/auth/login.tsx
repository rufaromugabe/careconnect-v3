"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';

export default function LoginComponent() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    signIn,
    signInWithGoogle,
    isSupabaseInitialized,
    getUserRole,
  } = useAuth();
  const searchParams = useSearchParams();

  // Check for error parameters in the URL
  useState(() => {
    const error = searchParams.get("error");
    if (error === "role_assignment_failed") {
      toast.error("Failed to assign a role to your account. Please try again or contact support.");
    } else if (error === "patient_creation_failed") {
      toast.error("Failed to create your patient profile. Please try again or contact support.");
    }
  });

  // Handle login function for better performance
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseInitialized) {
      toast.error("The authentication system is not properly configured. Please contact support.");
      return;
    }

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Login page - Attempting to sign in:", email);
      const { error, session } = await signIn(email, password);

      if (error) {
        console.error("Login page - Login error:", error);
        const isInvalidCredentials = error.message
          .toLowerCase()
          .includes("invalid login credentials");

        toast.error(
          isInvalidCredentials
            ? "Incorrect email or password. Please try again."
            : error.message || "An error occurred. Please try again later.",
          { autoClose: 4000 }
        );
        return;
      }

      if (!session) {
        console.error("Login page - No session after login");
        toast.error("Failed to establish a session. Please try again.");
        return;
      }

      console.log("Login page - Login successful, session established");

      // If metadata has role, use it directly
      if (session.user.user_metadata?.role) {
        const role = session.user.user_metadata.role;
        const isVerified = session.user.user_metadata?.is_verified === true;
        const isActive = session.user.user_metadata?.is_active === true;

        console.log("Login page - Found role in metadata:", role);

        // Check verification status
        if (!isVerified) {
          console.log("Login page - User is not verified, redirecting to verification");
          // Use setTimeout to ensure all state updates are complete before navigation
          setTimeout(() => {
            router.replace(`/${role}/verify`);
          }, 100);
          return;
        }
        
        // Check active status
        if (!isActive) {
          console.log("Login page - User is not active, redirecting to inactive page");
          // Use setTimeout to ensure all state updates are complete before navigation
          setTimeout(() => {
            router.replace(`/${role}/in-active`);
          }, 100);
          return;
        }

        // Redirect to dashboard
        console.log("Login page - Redirecting to dashboard for role:", role);
        // Use setTimeout to ensure all state updates are complete before navigation
        setTimeout(() => {
          router.replace(`/${role}/dashboard`);
        }, 100);
        return;
      }

      // If no metadata, try to get the role from the database
      const role = await getUserRole();
      if (role) {
        console.log("Login page - Redirecting to role dashboard:", role);
        // Use setTimeout to ensure all state updates are complete before navigation
        setTimeout(() => {
          router.replace(`/${role}/dashboard`);
        }, 100);
      } else {
        console.log("Login page - No role found, redirecting to role selection");
        // Use setTimeout to ensure all state updates are complete before navigation
        setTimeout(() => {
          router.replace("/auth/select-role");
        }, 100);
      }
    } catch (error) {
      console.error("Login page - Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-md"
    >
      <Card className="w-full p-8 shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 border border-gray-200/50 dark:border-gray-800/50">
        <div className="space-y-6">
          {!isSupabaseInitialized && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                The application is not properly configured. Please make sure the
                environment variables are set correctly.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isSupabaseInitialized}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isSupabaseInitialized}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full group relative overflow-hidden"
                disabled={isLoading || !isSupabaseInitialized}
              >
                <span className="relative z-10">
                  {isLoading ? "Logging in..." : "Login"}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </motion.div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full group relative overflow-hidden"
                disabled={!isSupabaseInitialized}
                onClick={async () => {
                  try {
                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast.error(error.message);
                    }
                  } catch (error) {
                    console.error("Google login error:", error);
                    toast.error("An unexpected error occurred");
                  }
                }}
              >
                <span className="relative z-10 flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                  Sign in with Google
                  <span className="ml-2 text-xs text-muted-foreground">
                    (as Patient)
                  </span>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </motion.div>
          </form>

          <motion.div
            className="text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <a
              href="#"
              className="hover:underline text-primary transition-colors"
            >
              Forgot password?
            </a>
            <span className="mx-2">•</span>
            <a
              href="/register"
              className="hover:underline text-primary transition-colors"
            >
              Create an account
            </a>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}