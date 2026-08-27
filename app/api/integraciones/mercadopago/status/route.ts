import { NextResponse } from 'next/server'
import { decryptJson, tokenCookie } from '@/lib/integration-oauth'

type Credential = { userId: string; providerUserId?: string | number | null; expiresAt?: number }

export async function GET(request: Request) {
  const raw = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${tokenCookie('mercadopago')}=`))?.split('=').slice(1).join('=')
  const credential = decryptJson<Credential>(raw)
  if (!credential) return NextResponse.json({ connected: false })
  return NextResponse.json({ connected: true, userId: credential.providerUserId ?? null, expiresAt: credential.expiresAt ?? null })
}
