import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

export function middleware() {
  // Temporarily bypassing authentication checks
  // Simply allow all requests to proceed
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};