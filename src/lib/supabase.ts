import { createClient } from '@supabase/supabase-js'

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Add this to your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
