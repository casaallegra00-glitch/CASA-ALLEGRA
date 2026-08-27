import { NextResponse } from 'next/server'
import { authorizationUrl, cookieOptions, encryptJson, stateCookie } from '@/lib/integration-oauth'

export async function GET(request: Request) {
  try {
    // TODO: replace this temporary identity with the authenticated CASA ALLEGRA user id.
    const userId = 'current-user'
    const state = encryptJson({ userId, provider: 'mercadopago', createdAt: Date.now() })
    const redirect = NextResponse.redirect(authorizationUrl('mercadopago', request, state))
    redirect.cookies.set(stateCookie('mercadopago'), state, cookieOptions(10 * 60))
    return redirect
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'oauth_not_configured'
    return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadopago&reason=${encodeURIComponent(reason)}`, request.url))
  }
}
