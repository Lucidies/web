import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Valorant API is currently disabled' },
    { status: 503 }
  );
}

