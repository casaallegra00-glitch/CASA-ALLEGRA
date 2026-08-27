import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

export type IntegrationProvider = 'mercadopago' | 'mercadolibre'

const secret = () => process.env.integration_encryption_secret || process.env.MERCADOPAGO_CLIENT_SECRET || ''

function key() {
  const value = secret()
  if (!value) throw new Error('integration_encryption_secret is not configured')
  return createHash('sha256').update(value).digest()
}

export function encryptJson(value: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decryptJson<T>(value?: string | null): T | null {
  if (!value) return null
  try {
    const [ivRaw, tagRaw, dataRaw] = value.split('.')
    if (!ivRaw || !tagRaw || !dataRaw) return null
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivRaw, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'))
    const plain = Buffer.concat([decipher.update(Buffer.from(dataRaw, 'base64url')), decipher.final()]).toString('utf8')
    return JSON.parse(plain) as T
  } catch {
    return null
  }
}

export function cookieOptions(maxAge = 60 * 60 * 24 * 180) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge }
}

export function getRedirectUri(request: Request, provider: IntegrationProvider) {
  const configured = process.env.integration_public_url || new URL(request.url).origin
  return `${configured}/api/integraciones/${provider}/callback`
}

export function authorizationUrl(provider: IntegrationProvider, request: Request, state: string) {
  const redirectUri = getRedirectUri(request, provider)
  if (provider === 'mercadopago') {
    const clientId = process.env.mercadopago_client_id
    if (!clientId) throw new Error('mercadopago_client_id is not configured')
    const url = new URL('https://auth.mercadopago.com.ar/authorization')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('platform_id', 'mp')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('state', state)
    return url.toString()
  }
  const clientId = process.env.mercadolibre_client_id
  if (!clientId) throw new Error('mercadolibre_client_id is not configured')
  const url = new URL('https://auth.mercadolibre.com.ar/authorization')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

export function tokenCookie(provider: IntegrationProvider) {
  return `casa_allegra_${provider}_credential`
}

export function stateCookie(provider: IntegrationProvider) {
  return `casa_allegra_${provider}_oauth_state`
}
