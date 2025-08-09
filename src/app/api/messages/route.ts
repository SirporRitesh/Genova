// app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabaseServer/supabaseServer-js';
import { getSession } from '@auth0/nextjs-auth0/edge';

// Server-side supabaseServer client (use service role key only on server)
const supabaseServerAdmin = createClient(
  process.env.NEXT_PUBLIC_supabaseServer_URL!, 
  process.env.supabaseServer_SERVICE_ROLE_KEY!
);

// GET: Fetch messages for authenticated user
export async function GET(request: Request) {
  try {
    // Create a response object for Auth0
    const res = new Response();
    const session = await getSession(request, res);

    if (!session?.user) {
      return NextResponse.json([], { status: 200 });
    }

    const userId = session.user.sub;

    const { data, error } = await supabaseServerAdmin
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('supabaseServer GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error fetching messages:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a new message
export async function POST(request: Request) {
  try {
    // Create a response object for Auth0
    const res = new Response();
    const session = await getSession(request, res);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const body = await request.json();
    const { role, text, image_url } = body ?? {};

    // basic validation
    if (!role || (role !== 'user' && role !== 'assistant')) {
      return NextResponse.json({ error: 'Invalid or missing role' }, { status: 400 });
    }
    if (!text && !image_url) {
      return NextResponse.json({ error: 'Either text or image_url is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServerAdmin
      .from('messages')
      .insert([{
        role,
        text: text ?? null,
        user_id: userId,
        image_url: image_url ?? null
      }])
      .select()
      .single();

    if (error) {
      console.error('supabaseServer INSERT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error saving message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
