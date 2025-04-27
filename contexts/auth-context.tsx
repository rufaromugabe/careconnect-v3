"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';

// Add the signInWithGoogle function to the AuthContextType interface
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: any; session: Session | null }>;
  signUp: (
    email: string,
    password: string,
    userData: any
  ) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<string | null>;
  signInWithGoogle: () => Promise<{ error: any }>;
  isSupabaseInitialized: boolean;
  refreshSession: () => Promise<Session | null>;
  hasRole: (role: string) => Promise<boolean>;
  isProfileCompleted: () => boolean;
  isVerified: () => boolean;
  isActive: () => boolean;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: string;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(initialRole || null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();

  // Optimized session refresh function
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return null;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Update role in state if available in metadata
        if (data.session.user.user_metadata?.role) {
          setUserRole(data.session.user.user_metadata.role);
        }
      }

      return data.session;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  }, []);

  // Update user metadata
  const updateUserMetadata = useCallback(async (metadata: Record<string, any>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        console.error("Error updating user metadata:", error);
        throw error;
      }

      // Refresh the session to get updated metadata
      await refreshSession();
    } catch (error) {
      console.error("Error in updateUserMetadata:", error);
      throw error;
    }
  }, [refreshSession]);

  // Initialize auth state
  useEffect(() => {
    if (hasInitialized) {
      console.log("Auth context - Already initialized, skipping");
      return;
    }

    const initAuth = async () => {
      try {
        console.log("Auth context - Initializing session");
        setIsLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth context - Session error:", error);
          if (error.message.includes("supabaseUrl is required")) {
            setIsSupabaseInitialized(false);
            toast.error("Failed to initialize Supabase client")
          }
          setIsLoading(false);
          return;
        }

        console.log("Auth context - Session exists:", !!session);
        if (session) {
          setSession(session);
          setUser(session.user);

          // Use initial role if provided
          if (initialRole) {
            setUserRole(initialRole);
            console.log("Auth context - Using initial role:", initialRole);
          } else if (session.user.user_metadata?.role) {
            // Get role from user metadata
            setUserRole(session.user.user_metadata.role);
            console.log("Auth context - Using role from metadata:", session.user.user_metadata.role);
          }
        }
      } catch (error) {
        console.error("Auth context - Error initializing auth:", error);
        setIsSupabaseInitialized(false);
      } finally {
        setIsLoading(false);
        setHasInitialized(true); // Set the initialization flag to true
      }
    };

    initAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth context - Auth state changed, event:", _event);
      console.log("Auth context - New session exists:", !!session);

      if (_event === "SIGNED_IN" || _event === "USER_UPDATED") {
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Update role from metadata if available
          if (session.user.user_metadata?.role) {
            setUserRole(session.user.user_metadata.role);
          }
        }
      } else if (_event === "SIGNED_OUT") {
        // Clear all session data
        setSession(null);
        setUser(null);
        setUserRole(null);
      } else if (_event === "TOKEN_REFRESHED") {
        // Just update the session
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialRole, hasInitialized]);

  // Optimized sign in function
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseInitialized) {
        return {
          error: new Error("Authentication system is not properly configured"),
          session: null,
        };
      }

      try {
        console.log("Auth context - Signing in user:", email);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.log("Auth context - Sign in error:", error);
         
          return { error, session: null };
        }

        console.log(
          "Auth context - Sign in successful, session exists:",
          !!data.session
        );

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);

          // Get role from user metadata
          if (data.session.user.user_metadata?.role) {
            const role = data.session.user.user_metadata.role;
            setUserRole(role);
          }
        }

        return { error: null, session: data.session };
      } catch (error) {
        console.error("Auth context - Sign in error:", error);
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
        return { error, session: null };
      }
    },
    [isSupabaseInitialized]
  );

  // Keep the signUp function but optimize it
  const signUp = useCallback(
    async (email: string, password: string, userData: any) => {
      if (!isSupabaseInitialized) {
        return {
          data: null,
          error: new Error("Authentication system is not properly configured"),
        };
      }

      try {
        console.log("Auth context - Signing up user:", email);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: userData.name,
              role: userData.role,
              profile_completed: false,
              is_verified: false,
              is_active: false
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
        console.log(
          "Auth context - Sign up successful, user created:",
          !!data.user
        );

        // Set the user role if available
        if (userData.role) {
          setUserRole(userData.role);
        }

        return { data, error: null };
      } catch (error) {
        console.error("Auth context - Sign up error:", error);
        return { data: null, error };
      }
    },
    [isSupabaseInitialized]
  );

  // Optimized sign out function
  const signOut = useCallback(async () => {
    if (!isSupabaseInitialized) {
      router.push("/");
      return;
    }

    try {
      console.log("Auth context - Signing out user");
      await supabase.auth.signOut();

      // Clear state
      setSession(null);
      setUser(null);
      setUserRole(null);

      router.push("/");
    } catch (error) {
      console.error("Auth context - Sign out error:", error);
      router.push("/");
    }
  }, [isSupabaseInitialized, router]);

  // Optimized getUserRole function
  const getUserRole = useCallback(async () => {
    console.log("Auth context - getUserRole called");

    // If we have the role in state, return it
    if (userRole) {
      console.log("Auth context - Using cached role from state:", userRole);
      return userRole;
    }

    // If no user is authenticated, return null
    if (!isSupabaseInitialized || !user) {
      console.log("Auth context - No authenticated user, returning null role");
      return null;
    }

    // Check user metadata first
    if (user.user_metadata?.role) {
      const role = user.user_metadata.role;
      setUserRole(role);
      return role;
    }

    // Try to get the role from the database as a fallback
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!error && data?.role) {
        console.log("Auth context - Got role from database:", data.role);
        
        // Update user metadata with the role
        await updateUserMetadata({ role: data.role });
        
        setUserRole(data.role);
        return data.role;
      }
    } catch (error) {
      console.error("Auth context - Database query error:", error);
    }

    return null;
  }, [userRole, isSupabaseInitialized, user, updateUserMetadata]);

  // Optimized Google sign in
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseInitialized) {
      return {
        error: new Error("Authentication system is not properly configured"),
      };
    }

    try {
      console.log("Auth context - Signing in with Google");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      return { error };
    } catch (error) {
      console.error("Auth context - Google sign in error:", error);
      return { error };
    }
  }, [isSupabaseInitialized]);

  // Optimized hasRole function
  const hasRole = useCallback(
    async (requiredRole: string) => {
      // If we have the role in state, use it
      if (userRole) {
        // For super-admin, allow access to all roles
        if (userRole === "super-admin") return true;
        return userRole === requiredRole;
      }

      if (!isSupabaseInitialized || !user) return false;

      try {
        // Get the role if we don't have it yet
        const role = await getUserRole();

        // For super-admin, allow access to all roles
        if (role === "super-admin") return true;

        return role === requiredRole;
      } catch (error) {
        console.error("Auth context - Check role error:", error);
        return false;
      }
    },
    [userRole, isSupabaseInitialized, user, getUserRole]
  );

  // Helper functions to check user status directly from metadata
  const isProfileCompleted = useCallback(() => {
    return user?.user_metadata?.profile_completed === true;
  }, [user]);

  const isVerified = useCallback(() => {
    return user?.user_metadata?.is_verified === true;
  }, [user]);

  const isActive = useCallback(() => {
    return user?.user_metadata?.is_active === true;
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      getUserRole,
      signInWithGoogle,
      isSupabaseInitialized,
      refreshSession,
      hasRole,
      isProfileCompleted,
      isVerified,
      isActive,
      updateUserMetadata,
    }),
    [
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      getUserRole,
      signInWithGoogle,
      isSupabaseInitialized,
      refreshSession,
      hasRole,
      isProfileCompleted,
      isVerified, 
      isActive,
      updateUserMetadata,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
