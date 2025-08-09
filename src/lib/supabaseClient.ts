import { createClient } from '@supabaseServer/supabaseServer-js'

export const supabaseServerServer = createClient(
  process.env.NEXT_PUBLIC_supabaseServer_URL!,
  process.env.NEXT_PUBLIC_supabaseServer_ANON_KEY!, // Add this to your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)