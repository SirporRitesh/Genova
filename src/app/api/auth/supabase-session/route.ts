import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import { createClient } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabaseClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: Request) {

  console.log("herreeeeee")
  try {
    const res = new Response();
    const session = await getSession(req, res);
    
    if (!session || !session.idToken) {
      return NextResponse.json({ 
        error: 'No Auth0 session or ID token' 
      }, { status: 401 });
    }

    // Exchange Auth0 token for Supabase session
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'auth0',
      token: session.idToken,
    });

    if (error) {
      console.error('Supabase sign-in error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      session: data.session 
    });
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}