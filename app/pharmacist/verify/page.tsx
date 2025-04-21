"use client"
import React from 'react';
import { useAuth } from "@/contexts/auth-context"
import { LogOut, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WaitingForAdmin() {
  const { signOut } = useAuth()
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 opacity-80" />
      <div className="fixed inset-0" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b88eb' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-center">Verification Required</CardTitle>
          <CardDescription className="text-center">
            Your account is pending administrator approval. This usually takes 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>We take our verification process seriously to ensure the highest standards of medical care.</p>
          <p className="mt-2">You will be notified via email once your account has been approved.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full max-w-[200px]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
