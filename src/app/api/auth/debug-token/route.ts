import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function GET(req: Request) {
  try {
    const res = new Response();
    const session = await getSession(req, res);
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Not authenticated with Auth0'
      }, { status: 401 });
    }

    // Return safe, non-sensitive parts of the token for debugging
    return NextResponse.json({
      sub: session.user.sub,
      email: session.user.email,
      hasIdToken: !!session.idToken,
      idTokenLength: session.idToken?.length || 0,
    });
  } catch (error) {
    console.error('Debug token error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}