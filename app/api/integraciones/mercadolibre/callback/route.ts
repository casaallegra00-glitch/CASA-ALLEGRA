import { NextResponse } from 'next/server'
import { decryptJson, encryptJson, getRedirectUri, cookieOptions, stateCookie, tokenCookie } from '@/lib/integration-oauth'

type State = { userId: string; provider: string; createdAt: number }

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const stateCookieValue = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${stateCookie('mercadolibre')}=`))?.split('=').slice(1).join('=')
  const saved = decryptJson<State>(stateCookieValue)
  if (error) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadolibre&reason=${encodeURIComponent(error)}`, url))
  if (!code || !state || !saved || saved.provider !== 'mercadolibre' || saved.createdAt < Date.now() - 10 * 60 * 1000) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadolibre&reason=invalid_state', url))
  const clientId = process.env.mercadolibre_client_id
  const clientSecret = process.env.mercadolibre_client_secret
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadolibre&reason=server_not_configured', url))
  const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, client_secret: clientSecret, code, redirect_uri: getRedirectUri(request, 'mercadolibre') })
  const response = await fetch('https://api.mercadolibre.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadolibre&reason=${encodeURIComponent(data.message || data.error || 'token_exchange_failed')}`, url))
  const credential = { userId: saved.userId, provider: 'mercadolibre', accessToken: data.access_token, refreshToken: data.refresh_token || '', expiresAt: Date.now() + Number(data.expires_in || 21600) * 1000, providerUserId: data.user_id || null }
  const redirect = NextResponse.redirect(new URL('/integraciones?oauth=mercadolibre', url))
  redirect.cookies.set(tokenCookie('mercadolibre'), encryptJson(credential), cookieOptions())
  redirect.cookies.set(stateCookie('mercadolibre'), '', cookieOptions(0))
  return redirect
}
