"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Heart, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatedBeam, AnimatedGradientText } from "@/components/ui/animated-beam"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signUp, signIn, signInWithGoogle, isSupabaseInitialized, refreshSession } = useAuth()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseInitialized) {
      toast({
        title: "Configuration Error",
        description: "The authentication system is not properly configured. Please contact support.",
        variant: "destructive",
      })
      return
    }

    if (!name || !email || !password || !confirmPassword || !role) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Register page - Registering user:", email)
      // Register the user with simplified userData
      const { data, error } = await signUp(email, password, {
        name,
        role,
      })

      if (error) {
        console.error("Register page - Registration error:", error)
        toast({
          title: "Registration failed",
          description: error.message || "An unexpected error occurred during registration",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // If we have a user, we'll use a server action to create the role and role-specific entries
      if (data?.user) {
        try {
          console.log("Register page - User created, setting up role")
          // Call the role setup API directly
          const response = await fetch("/api/auth/create-role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: data.user.id,
              role: role,
              name: name,
            }),
          })

          // Log the raw response for debugging
          console.log("Register page - Role setup API response status:", response.status)

          // Get the response text first for debugging
          const responseText = await response.text()
          console.log("Register page - Role setup API response:", responseText)

          // Try to parse as JSON if possible
          let result
          try {
            result = JSON.parse(responseText)
          } catch (e) {
            console.error("Register page - Failed to parse API response as JSON:", e)
            throw new Error("Invalid response format from server")
          }

          if (!response.ok) {
            throw new Error(result.error || "Failed to create user role")
          }

          console.log("Register page - Role setup successful, signing in user")
        } catch (setupError) {
          console.warn("Register page - Role setup issue:", setupError)
          console.log("Register page - Continuing with sign in despite role setup issue")
        }

        // Set the role cookie directly as a backup
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

        // Explicitly sign in the user after registration
        const { error: signInError, session } = await signIn(email, password)

        if (signInError) {
          console.error("Register page - Sign in error after registration:", signInError)
          toast({
            title: "Registration successful",
            description: "Your account has been created, but we couldn't sign you in automatically. Please log in.",
          })
          router.push("/")
          return
        }

        if (!session) {
          console.error("Register page - No session after sign in")
          toast({
            title: "Registration successful",
            description: "Your account has been created, but we couldn't sign you in automatically. Please log in.",
          })
          router.push("/")
          return
        }

        console.log("Register page - Sign in successful, session established")

        // Update user metadata to mark profile as not completed
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            profile_completed: false,
            role: role, // Also store role in metadata as backup
          },
        })

        if (metadataError) {
          console.error("Register page - Error updating user metadata:", metadataError)
        }

        toast({
          title: "Registration successful",
          description: "Your account has been created and you're now signed in.",
        })

        console.log("Register page - Redirecting to dashboard:", role)

        // Force a 1-second delay before redirect to ensure cookies are set
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Redirect to the appropriate dashboard
        router.push(`/${role}/dashboard`)
      } else {
        // This shouldn't happen if there's no error, but just in case
        console.log("Register page - No user data returned after registration")
        toast({
          title: "Registration issue",
          description:
            "Your account was created, but we couldn't retrieve your user information. Please try logging in.",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Register page - Registration error:", error)
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            Create your account to get started
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
                <motion.h2
                  className="text-2xl font-bold text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Register
                </motion.h2>

                <form onSubmit={handleRegister} className="space-y-4">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={!isSupabaseInitialized}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={!isSupabaseInitialized}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole} required disabled={!isSupabaseInitialized}>
                      <SelectTrigger
                        id="role"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                      >
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      className="w-full group relative overflow-hidden"
                      disabled={isLoading || !isSupabaseInitialized}
                    >
                      <span className="relative z-10">{isLoading ? "Creating account..." : "Register"}</span>
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
                    transition={{ delay: 1.1, duration: 0.5 }}
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
                              title: "Registration failed",
                              description: error.message,
                              variant: "destructive",
                            })
                          }
                        } catch (error) {
                          console.error("Google registration error:", error)
                          toast({
                            title: "Registration failed",
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
                        Sign up with Google
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
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  Already have an account?{" "}
                  <Link href="/" className="text-primary hover:underline transition-colors">
                    Log in
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
