import { NextResponse } from 'next/server'
import { decryptJson, getRedirectUri } from '@/lib/integration-oauth'
import { saveIntegrationCredential } from '@/lib/integration-store'

type State = { userId: string; provider: string; createdAt: number }

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  if (error) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadopago&reason=${encodeURIComponent(error)}`, url))

  const saved = decryptJson<State>(state)
  if (!code || !state || !saved || saved.provider !== 'mercadopago' || !saved.userId || saved.createdAt < Date.now() - 10 * 60 * 1000) {
    return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadopago&reason=invalid_state', url))
  }

  const clientId = process.env.mercadopago_client_id
  const clientSecret = process.env.mercadopago_client_secret
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadopago&reason=server_not_configured', url))

  const redirectUri = getRedirectUri(request, 'mercadopago')
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) return NextResponse.redirect(new URL(`/integraciones?oauth_error=mercadopago&reason=${encodeURIComponent(data.message || data.error || 'token_exchange_failed')}`, url))

  const credential = {
    userId: saved.userId,
    provider: 'mercadopago' as const,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresAt: Date.now() + Number(data.expires_in || 15552000) * 1000,
    providerUserId: data.user_id || null,
    publicKey: data.public_key || null,
  }

  if (!await saveIntegrationCredential(credential)) return NextResponse.redirect(new URL('/integraciones?oauth_error=mercadopago&reason=database_not_configured', url))

  return NextResponse.redirect(new URL('/integraciones?oauth=mercadopago', url))
}
