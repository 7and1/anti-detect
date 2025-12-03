import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    openRouterKeyPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'not set',
    model: process.env.OPENROUTER_MODEL || 'not set',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      received: body,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 400 });
  }
}
