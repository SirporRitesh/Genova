"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState, ReactNode } from 'react';
import { supabaseServer } from '@/lib/supabaseClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const [supabaseServerReady, setsupabaseServerReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    async function syncAuth() {
      if (!user) {
        setsupabaseServerReady(true);
        return;
      }

      try {
        console.log("Attempting to sync Auth0 with supabaseServer...");
        
        // Try to get current supabaseServer session first
        const { data: { session: existingSession } } = await supabaseServer.auth.getSession();
        
        if (existingSession) {
          console.log("Existing supabaseServer session found");
          setsupabaseServerReady(true);
          return;
        }
        
        // Call our API route to exchange tokens
        const res = await fetch('/api/auth/supabaseServer-session');
        const data = await res.json();
        
        if (!res.ok) {
          console.error("supabaseServer sync error:", data);
          setSyncError(data.error || "Failed to sync with supabaseServer");
          setsupabaseServerReady(true); // Still continue even with error
          return;
        }
        
        console.log("Auth0-supabaseServer sync successful");
        
        // Check if supabaseServer recognizes the user
        const { data: userData } = await supabaseServer.auth.getUser();
        console.log('supabaseServer user after sync:', userData.user);
        
        setsupabaseServerReady(true);
      } catch (error) {
        console.error('Auth sync error:', error);
        setSyncError(String(error));
        setsupabaseServerReady(true); // Still render app, just without supabaseServer auth
      }
    }

    if (user && !isLoading) {
      syncAuth();
    } else if (!isLoading) {
      setsupabaseServerReady(true);
    }
  }, [user, isLoading]);

  // Show loading state while we sync auth
  if (isLoading || !supabaseServerReady) {
    return <div className="d-flex justify-content-center pt-5">Loading authentication...</div>;
  }

  // Add a visual indicator if sync failed
  if (syncError) {
    console.warn("Auth sync error:", syncError);
    // We don't block the app, just show warning in console
  }

  return <>{children}</>;
}