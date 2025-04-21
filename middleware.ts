import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';

  // Get token from cookies (assumes you're storing the token as a cookie)
  const token = request.cookies.get('token')?.value;

  const isAuthenticated = !!token;

  if (!isAuthenticated && !isPublicPath) {
    // Not authenticated and trying to access a protected route
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicPath) {
    // Authenticated user trying to access login
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Middleware applies to all routes except these
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
