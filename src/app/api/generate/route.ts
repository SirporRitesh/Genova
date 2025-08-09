import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const session = await getSession(request, new NextResponse());

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    const user = session.user;
    console.log(`Image generation request from user: ${user.email || user.sub}`);

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Rate limiting per user (optional enhancement)
    console.log(`Generating image for user ${user.sub}: "${prompt}"`);

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt
        }),
      }
    );

    if (!hfResponse.ok) {
      const error = await hfResponse.text();
      console.error(`HF API Error for user ${user.sub}:`, error);
      throw new Error(`Failed to generate image: ${error}`);
    }

    const buffer = await hfResponse.arrayBuffer();
    
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. The model might be loading, please try again.' },
      { status: 500 }
    );
  }
}