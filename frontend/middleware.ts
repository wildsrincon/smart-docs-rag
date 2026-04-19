import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/dashboard', '/chat', '/documents', '/settings']
const authPaths = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p))
  const isAuthPath = authPaths.some(p => pathname.startsWith(p))

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/documents/:path*', '/settings/:path*', '/login', '/signup'],
}
