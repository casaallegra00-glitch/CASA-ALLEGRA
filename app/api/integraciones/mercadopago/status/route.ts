import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ connected: false })
  const stored = await getIntegrationCredential(user.id, 'mercadopago')
  return NextResponse.json({
    connected: Boolean(stored?.accessToken),
    userId: stored?.providerUserId ?? null,
    expiresAt: stored?.expiresAt ?? null,
  })
}
