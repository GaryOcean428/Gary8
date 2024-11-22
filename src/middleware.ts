import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from './lib/utils/rate-limiter';

export async function middleware(request: NextRequest) {
  // Check rate limit
  const ip = request.ip ?? '127.0.0.1';
  try {
    await rateLimiter.check(ip);
  } catch {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Add security headers
  const headers = new Headers(request.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
