"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    async function syncAuth() {
      if (!user) {
        setSupabaseReady(true);
        return;
      }

      try {
        console.log("Attempting to sync Auth0 with Supabase...");
        
        // Try to get current Supabase session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log("Existing Supabase session found");
          setSupabaseReady(true);
          return;
        }
        
        // Call our API route to exchange tokens
        const res = await fetch('/api/auth/supabase-session');
        const data = await res.json();
        
        if (!res.ok) {
          console.error("Supabase sync error:", data);
          setSyncError(data.error || "Failed to sync with Supabase");
          setSupabaseReady(true); // Still continue even with error
          return;
        }
        
        console.log("Auth0-Supabase sync successful");
        
        // Check if Supabase recognizes the user
        const { data: userData } = await supabase.auth.getUser();
        console.log('Supabase user after sync:', userData.user);
        
        setSupabaseReady(true);
      } catch (error) {
        console.error('Auth sync error:', error);
        setSyncError(String(error));
        setSupabaseReady(true); // Still render app, just without Supabase auth
      }
    }

    if (user && !isLoading) {
      syncAuth();
    } else if (!isLoading) {
      setSupabaseReady(true);
    }
  }, [user, isLoading]);

  // Show loading state while we sync auth
  if (isLoading || !supabaseReady) {
    return <div className="d-flex justify-content-center pt-5">Loading authentication...</div>;
  }

  // Add a visual indicator if sync failed
  if (syncError) {
    console.warn("Auth sync error:", syncError);
    // We don't block the app, just show warning in console
  }

  return <>{children}</>;
}