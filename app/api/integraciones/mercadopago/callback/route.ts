import { NextResponse } from 'next/server'
import { decryptJson, getRedirectUri, cookieOptions, stateCookie, tokenCookie } from '@/lib/integration-oauth'

type State = { userId: string; provider: string; createdAt: number }

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const stateCookieValue = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${stateCookie('mercadopago')}=`))?.split('=').slice(1).join('=')
  const saved = decryptJson<State>(stateCookieValue)
  if (error) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadopago&reason=${encodeURIComponent(error)}`, url))
  if (!code || !state || !saved || saved.provider !== 'mercadopago' || saved.createdAt < Date.now() - 10 * 60 * 1000) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadopago&reason=invalid_state', url))
  const clientId = process.env.mercadopago_client_id
  const clientSecret = process.env.mercadopago_client_secret
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadopago&reason=server_not_configured', url))
  const response = await fetch('https://api.mercadopago.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, redirect_uri: getRedirectUri(request, 'mercadopago') }), cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadopago&reason=${encodeURIComponent(data.message || data.error || 'token_exchange_failed')}`, url))
  const credential = { userId: saved.userId, provider: 'mercadopago', accessToken: data.access_token, refreshToken: data.refresh_token || '', expiresAt: Date.now() + Number(data.expires_in || 15552000) * 1000, providerUserId: data.user_id || null, publicKey: data.public_key || null }
  const redirect = NextResponse.redirect(new URL('/integraciones?oauth=mercadopago', url))
  redirect.cookies.set(tokenCookie('mercadopago'), JSON.stringify(credential), { ...cookieOptions(), httpOnly: true })
  redirect.cookies.set(stateCookie('mercadopago'), '', cookieOptions(0))
  return redirect
}
