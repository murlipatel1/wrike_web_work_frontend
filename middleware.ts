import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';
  
  // Check if user is authenticated
  const isAuthenticated = request.cookies.has('isAuthenticated');

  // If trying to access a protected route without authentication
  if (!isAuthenticated && !isPublicPath) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login page while already authenticated
  if (isAuthenticated && isPublicPath) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};