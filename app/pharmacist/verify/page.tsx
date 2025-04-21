"use client"
import React, { useState } from 'react';
import { useAuth } from "@/contexts/auth-context"
import { LogOut } from 'lucide-react';

export default function WaitingForAdmin() {

  const { signOut } = useAuth()
    return (
        <div>
            Waiting for admin approval...
            <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
    );
};
