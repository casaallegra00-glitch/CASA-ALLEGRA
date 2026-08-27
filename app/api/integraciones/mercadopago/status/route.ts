import { NextResponse } from 'next/server'
import { decryptJson, tokenCookie } from '@/lib/integration-oauth'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

type Credential = { userId: string; providerUserId?: string | number | null; expiresAt?: number }

function getCookie(request: Request, name: string) { return request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.split('=').slice(1).join('=') }

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  const stored = user ? await getIntegrationCredential(user.id, 'mercadopago') : null
  if (stored) return NextResponse.json({ connected: true, userId: stored.providerUserId ?? null, expiresAt: stored.expiresAt ?? null })
  const credential = decryptJson<Credential>(getCookie(request, tokenCookie('mercadopago')))
  if (!credential || !user || credential.userId !== user.id) return NextResponse.json({ connected: false })
  return NextResponse.json({ connected: true, userId: credential.providerUserId ?? null, expiresAt: credential.expiresAt ?? null })
}
