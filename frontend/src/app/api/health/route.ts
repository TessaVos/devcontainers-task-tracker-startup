import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_SERVICE_URL || 'http://backend-service';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking backend health:', error);
    return NextResponse.json(
      { error: 'Backend health check failed' },
      { status: 500 }
    );
  }
}