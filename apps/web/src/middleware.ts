import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/uploads/')) {
    const target = new URL(`/api${pathname}`, request.url);
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/uploads/:path*'],
};
