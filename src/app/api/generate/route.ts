import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Call Hugging Face Stable Diffusion
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      return NextResponse.json({ error: 'Image generation error' }, { status: 500 });
    }
    
    // Return image binary data directly
    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/jpeg" }
    });
  } catch (error) {
    console.error('Error in image generation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}