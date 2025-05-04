"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, UserX, UserCheck, Filter } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { logAction } from "@/lib/logging";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Stethoscope,
  Pill,
  User as UserIcon,
  UserCog,
  UserCircle,
} from "lucide-react";

export default function SuperAdminUsersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);

        // First, check if the user has the super-admin role in their metadata
        const isSuperAdmin = user.user_metadata?.role === "super-admin";

        if (!isSuperAdmin) {
          throw new Error("Unauthorized: User is not a super admin");
        }

        // Get the session for the auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("No authentication token available");
        }

        // Fetch users directly using the admin API endpoint
        const response = await fetch("/api/admin/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API response error:", response.status, errorData);
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const userData = await response.json();
        console.log(userData);

        // Format the user data
        const formattedUsers = userData.map((user: any) => ({
          id: user.id,
          email: user.email,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Unknown",
          role: user.user_metadata?.role || "Unknown",
          is_active: user.user_metadata?.is_active || false,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        }));

        setUsers(formattedUsers);
        console.log("Fetched users:", formattedUsers);
        setFilteredUsers(formattedUsers);
      } catch (err: any) {
        console.error("Error loading users data:", err);
        setError(err.message || "Failed to load users data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    // Filter users based on active tab
    if (activeTab === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.role === activeTab));
    }
  }, [activeTab, users]);
  const handleToggleActive = async (
    userId: string,
    currentIsActive: boolean
  ) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error("No authentication token available");
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentIsActive }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update user verification status"
        );
      }
      //log action
      const action = currentIsActive
        ? `disabled user account: ${userId}`
        : `enabled user account: ${userId}`;

      if (user) {
        await logAction(user.id, action, {
          email: user.email,
          userId,
          newStatus: currentIsActive ? "Inactive" : "Active",
        });
      }

      // Refresh UI or update local state as needed
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_active: !currentIsActive } : user
        )
      );

      // Display success toast notification
      toast.success(
        `User ${currentIsActive ? "disabled" : "enabled"} successfully`,
        {}
      );
    } catch (error) {
      console.error("Error updating verification:", error);

      // Display error toast notification
      toast.error(
        `Failed to ${currentIsActive ? "disable" : "enable"} user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {}
      );
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col">
          <Header title={`Loading `} />
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Loading users data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Error Loading Data
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/50">
      <Sidebar role="super-admin" />
      <div className="flex-1 flex flex-col">
        <Header title="User Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Users</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">
                  All Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="doctor">
                  Doctors ({users.filter((u) => u.role === "doctor").length})
                </TabsTrigger>
                <TabsTrigger value="patient">
                  Patients ({users.filter((u) => u.role === "patient").length})
                </TabsTrigger>
                <TabsTrigger value="pharmacist">
                  Pharmacists (
                  {users.filter((u) => u.role === "pharmacist").length})
                </TabsTrigger>
                <TabsTrigger value="nurse">
                  Nurses ({users.filter((u) => u.role === "nurse").length})
                </TabsTrigger>
                <TabsTrigger value="super-admin">
                  Admins ({users.filter((u) => u.role === "super-admin").length}
                  )
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeTab === "all"
                        ? "All Users"
                        : `${
                            activeTab.charAt(0).toUpperCase() +
                            activeTab.slice(1)
                          }s`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Created</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredUsers.length > 0 ? (
      filteredUsers.map((user) => {
        // Choose icon based on role
        const roleIcon =
          user.role === "doctor" ? (
            <Stethoscope className="h-4 w-4 mr-1 text-blue-600" />
          ) : user.role === "pharmacist" ? (
            <Pill className="h-4 w-4 mr-1 text-purple-600" />
          ) : user.role === "nurse" ? (
            <ShieldCheck className="h-4 w-4 mr-1 text-yellow-600" />
          ) : user.role === "super-admin" ? (
            <UserCog className="h-4 w-4 mr-1 text-red-600" />
          ) : user.role === "patient" ? (
            <UserCircle className="h-4 w-4 mr-1 text-green-600" />
          ) : (
            <UserIcon className="h-4 w-4 mr-1 text-gray-600" />
          );

        return (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <div className="flex items-center">
                {roleIcon}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "doctor"
                      ? "bg-blue-100 text-blue-800"
                      : user.role === "patient"
                      ? "bg-green-100 text-green-800"
                      : user.role === "pharmacist"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "nurse"
                      ? "bg-yellow-100 text-yellow-800"
                      : user.role === "super-admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex items-center">
                {user.is_active ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-1 text-red-600" />
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => handleToggleActive(user.id, user.is_active)}
                  variant="ghost"
                  size="sm"
                  className={
                    user.is_active
                      ? "text-red-600 hover:text-red-800"
                      : "text-green-600 hover:text-green-800"
                  }
                >
                  {user.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      })
    ) : (
      <TableRow>
        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
          No users found
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
