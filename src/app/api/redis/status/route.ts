import { checkRedisServer } from '../../../../lib/redis/dev-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const isRunning = await checkRedisServer();
    return NextResponse.json({ isRunning });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check Redis status' },
      { status: 500 }
    );
  }
}
