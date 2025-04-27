"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import LoginComponent from "@/components/auth/login";
import { Heart } from "lucide-react";
import Link from "next/link";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { user, session, getUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      if (session && user) {
        const role = await getUserRole();
        if (role) {
          router.push(`/${role}/dashboard`);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, [session, user, getUserRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      {/* Animated background */}
      <AnimatedBeam />
      
      {/* Logo and back link */}
      <div className="absolute top-8 left-8 flex items-center">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Heart className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold">CareConnect</span>
        </Link>
      </div>
      
      {/* Login component */}
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Login to access your account</p>
        </div>
        <LoginComponent />
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
