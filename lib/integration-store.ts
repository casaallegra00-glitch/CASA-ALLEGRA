import { createClient } from '@supabase/supabase-js'
import { encryptJson, decryptJson } from '@/lib/integration-oauth'

export type StoredCredential = {
  userId: string
  provider: 'mercadopago' | 'mercadolibre'
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  providerUserId?: string | number | null
  publicKey?: string | null
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function saveIntegrationCredential(credential: StoredCredential) {
  const client = admin()
  if (!client) return false
  const encrypted = encryptJson(credential)
  const { error } = await client.from('integration_connections').upsert({
    user_id: credential.userId,
    provider: credential.provider,
    credential: { encrypted },
    provider_user_id: credential.providerUserId == null ? null : String(credential.providerUserId),
    expires_at: credential.expiresAt ? new Date(credential.expiresAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })
  return !error
}

export async function getIntegrationCredential(userId: string, provider: StoredCredential['provider']) {
  const client = admin()
  if (!client) return null
  const { data } = await client.from('integration_connections').select('credential').eq('user_id', userId).eq('provider', provider).maybeSingle()
  const encrypted = data?.credential?.encrypted
  return encrypted ? decryptJson<StoredCredential>(encrypted) : null
}

export async function deleteIntegrationCredential(userId: string, provider: StoredCredential['provider']) {
  const client = admin()
  if (!client) return false
  const { error } = await client.from('integration_connections').delete().eq('user_id', userId).eq('provider', provider)
  return !error
}

export async function getUserFromBearer(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!accessToken || !url || !key) return null
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.getUser(accessToken)
  return error || !data.user ? null : data.user
}
