import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  // In development, you might want to provide a fallback for testing
  // In production, this should fail fast
}

if (!supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',  // Fallback only for development
  supabaseAnonKey || 'placeholder-key',  // Fallback only for development
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
