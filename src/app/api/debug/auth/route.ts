import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function GET(request: Request) {
  try {
    const res = new Response();
    const session = await getSession(request, res);
    
    return NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user ? {
        sub: session.user.sub,
        name: session.user.name,
        email: session.user.email
      } : null
    });
  } catch (error) {
    console.error('Auth0 session error:', error);
    return NextResponse.json({ 
      error: 'Error checking authentication',
      details: String(error)
    }, { status: 500 });
  }
}