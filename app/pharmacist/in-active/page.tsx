"use client";

import { useAuth } from "@/contexts/auth-context";
import { LogOut, Ban, Mail } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
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
            className="w-full max-w-[200px] text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
