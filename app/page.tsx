"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { Stethoscope, User, FlaskRoundIcon as Flask, Thermometer, Heart, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatedBeam, AnimatedGradientText } from "@/components/ui/animated-beam"
import { motion } from "framer-motion"

export default function Home() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn, signInWithGoogle, isSupabaseInitialized, refreshSession, getUserRole } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Check for error parameters in the URL
  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "role_assignment_failed") {
      toast({
        title: "Authentication error",
        description: "Failed to assign a role to your account. Please try again or contact support.",
        variant: "destructive",
      })
    } else if (error === "patient_creation_failed") {
      toast({
        title: "Authentication error",
        description: "Failed to create your patient profile. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseInitialized) {
      toast({
        title: "Configuration Error",
        description: "The authentication system is not properly configured. Please contact support.",
        variant: "destructive",
      })
      return
    }

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Login page - Attempting to sign in:", email)
      const { error, session } = await signIn(email, password)

      if (error) {
        console.error("Login page - Login error:", error)
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!session) {
        console.error("Login page - No session after login")
        toast({
          title: "Login failed",
          description: "Failed to establish a session. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("Login page - Login successful, session established")

      // Using cookie check first as it's fastest
      const roleCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_role="))
        ?.split("=")[1]

      if (roleCookie) {
        console.log("Login page - Found role in cookie, redirecting to:", roleCookie)
        router.push(`/${roleCookie}/dashboard`)
        return
      }

      // If user metadata contains role, use that (second fastest)
      if (session.user.user_metadata?.role) {
        const role = session.user.user_metadata.role
        console.log("Login page - Found role in user metadata, redirecting to:", role)
        router.push(`/${role}/dashboard`)
        return
      }

      // Last resort - get role from database/API
      const role = await getUserRole()
      if (role) {
        console.log("Login page - Redirecting to role dashboard:", role)
        router.push(`/${role}/dashboard`)
      } else {
        console.log("Login page - No role found, redirecting to role selection")
        router.push("/auth/select-role")
      }
    } catch (error) {
      console.error("Login page - Login error:", error)
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const roleIcons = [
    { Icon: Stethoscope, label: "Doctor", delay: 0.1 },
    { Icon: Thermometer, label: "Nurse", delay: 0.2 },
    { Icon: User, label: "Patient", delay: 0.3 },
    { Icon: Flask, label: "Pharmacist", delay: 0.4 },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center">
      {/* Animated background beam */}
      <AnimatedBeam />

      <div className="container relative z-10 mx-auto px-4 py-16 max-w-6xl">
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
              <Heart className="h-12 w-12 text-primary mr-3" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight">
              <AnimatedGradientText>CareConnect</AnimatedGradientText>
            </h1>
          </div>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            A comprehensive healthcare management system connecting doctors, nurses, patients, and pharmacists for
            better healthcare delivery.
          </motion.p>
        </motion.div>

        {!isSupabaseInitialized && (
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
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
            <Card className="w-full p-8 shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 border border-gray-200/50 dark:border-gray-800/50">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="grid grid-cols-4 gap-4">
                    {roleIcons.map(({ Icon, label, delay }, index) => (
                      <motion.div
                        key={label}
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delay, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs mt-1">{label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

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
                      <span className="relative z-10">{isLoading ? "Logging in..." : "Login"}</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  </motion.div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
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
                          const { error } = await signInWithGoogle()
                          if (error) {
                            toast({
                              title: "Login failed",
                              description: error.message,
                              variant: "destructive",
                            })
                          }
                        } catch (error) {
                          console.error("Google login error:", error)
                          toast({
                            title: "Login failed",
                            description: "An unexpected error occurred",
                            variant: "destructive",
                          })
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
                        <span className="ml-2 text-xs text-muted-foreground">(as Patient)</span>
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
                  <a href="#" className="hover:underline text-primary transition-colors">
                    Forgot password?
                  </a>
                  <span className="mx-2">•</span>
                  <a href="/register" className="hover:underline text-primary transition-colors">
                    Create an account
                  </a>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
