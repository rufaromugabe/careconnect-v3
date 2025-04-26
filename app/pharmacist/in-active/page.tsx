"use client";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, Ban, Mail, Link } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountDeactivated() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-slate-100 to-red-50 opacity-80" />
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ef4444' fillOpacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Ban className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-center">
            Account Temporarily Deactivated
          </CardTitle>
          <CardDescription className="text-center">
            Your account has been temporarily deactivated by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>This may be due to one of the following reasons:</p>
            <ul className="mt-2 list-disc pl-6 text-left">
              <li>Verification of credentials required</li>
              <li>Suspicious activity detected on your account</li>
              <li>Violation of platform terms of service</li>
              <li>Administrative review in progress</li>
            </ul>
            <p className="mt-4">
              If you believe this is an error, please contact our support team
              for assistance.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <a href="mailto:tinotendasibanda04@gmail.com">
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full max-w-[200px] text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
