import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedProto === 'http') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 308)
  }

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/integraciones')) {
    const hasSupabaseSession = request.cookies.getAll().some(({ name }) => name.includes('auth-token'))
    if (!hasSupabaseSession) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/'
      loginUrl.searchParams.set('login', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
