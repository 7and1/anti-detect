import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Extract all headers from the request
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Return the headers as JSON
  return NextResponse.json({
    headers,
    timestamp: new Date().toISOString(),
  });
}

// Also support POST for consistency
export async function POST(request: NextRequest) {
  return GET(request);
}
