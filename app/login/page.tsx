"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatedBeam, AnimatedGradientText } from "@/components/ui/animated-beam"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { motion } from "framer-motion"
import { toast } from "react-toastify"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn, signInWithGoogle, isSupabaseInitialized } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseInitialized) {
      toast.error("The authentication system is not properly configured. Please contact support.");
      return;
    }

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true)

    try {
      const { session, error } = await signIn(email, password)

      if (error) {
        toast.error(error.message);
        setIsLoading(false)
        return
      }

      // Successfully logged in
      toast.success("Login successful!");

      // Delay redirect slightly to allow for a smoother transition
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white flex flex-col items-center justify-center">
      {/* Animated background beam */}
      <AnimatedBeam />

      <div className="container relative z-10 mx-auto px-4 py-16 max-w-6xl">
        <div className="absolute top-4 right-4">
          <SimpleThemeToggle />
        </div>
        
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center items-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <Heart className="h-12 w-12 text-blue-400 mr-3" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight">
              <AnimatedGradientText>CareConnect</AnimatedGradientText>
            </h1>
          </div>
          <motion.p
            className="text-lg text-gray-400 max-w-2xl mx-auto mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Welcome back! Please log in to access your healthcare portal
          </motion.p>
        </motion.div>

        {!isSupabaseInitialized && (
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              The application is not properly configured. Please make sure the environment variables are set correctly.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="w-full p-8 shadow-xl backdrop-blur-sm bg-slate-900/80 border border-blue-900/30 shadow-blue-900/10">
              <div className="space-y-6">
                <motion.h2
                  className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Login
                </motion.h2>

                <form onSubmit={handleLogin} className="space-y-4">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading || !isSupabaseInitialized}
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 bg-slate-800/80 border-slate-700 placeholder:text-gray-500"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-300">Password</Label>
                      <Link href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">
                        Forgot Password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || !isSupabaseInitialized}
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 bg-slate-800/80 border-slate-700 placeholder:text-gray-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      className="w-full group relative overflow-hidden"
                      disabled={isLoading || !isSupabaseInitialized}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Logging in...
                        </>
                      ) : (
                        <span className="relative z-10">Login</span>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  </motion.div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full group relative overflow-hidden border-slate-700 text-gray-300"
                      disabled={isLoading || !isSupabaseInitialized}
                      onClick={async () => {
                        try {
                          const { error } = await signInWithGoogle();
                          if (error) {
                            toast.error(error.message);
                          }
                        } catch (error: any) {
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
                      </span>
                      <span className="absolute inset-0 bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  className="text-center text-sm text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-blue-400 hover:underline transition-colors">
                    Register
                  </Link>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
