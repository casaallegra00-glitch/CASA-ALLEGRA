import { NextResponse } from 'next/server'
import { deleteIntegrationCredential, getIntegrationCredential, getUserFromBearer, saveIntegrationCredential } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

type Provider = 'andreani' | 'correoargentino'

function validProvider(value: string): value is Provider {
  return value === 'andreani' || value === 'correoargentino'
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params
  if (!validProvider(provider)) return NextResponse.json({ error: 'Proveedor no válido.' }, { status: 404 })
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, provider)
  return NextResponse.json({ connected: Boolean(credential), configured: Boolean(credential), account: credential ? { providerUserId: credential.providerUserId ?? null } : null })
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params
  if (!validProvider(provider)) return NextResponse.json({ error: 'Proveedor no válido.' }, { status: 404 })
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })

  if (provider === 'andreani') {
    const apiKey = String((body as any).apiKey || '').trim()
    const account = String((body as any).account || '').trim()
    if (!apiKey && !account) return NextResponse.json({ error: 'Ingresá las credenciales de tu cuenta Andreani.' }, { status: 400 })
    const ok = await saveIntegrationCredential({ userId: user.id, provider, accessToken: apiKey, providerUserId: account || null, username: (body as any).username || null, password: (body as any).password || null, contract: (body as any).contract || null, apiKey: apiKey || null })
    return ok ? NextResponse.json({ connected: true }) : NextResponse.json({ error: 'No se pudieron guardar las credenciales de Andreani.' }, { status: 503 })
  }

  const agreement = String((body as any).agreement || '').trim()
  const apiKey = String((body as any).apiKey || '').trim()
  const sellerId = String((body as any).sellerId || '').trim()
  if (!agreement || !apiKey) return NextResponse.json({ error: 'Correo Argentino requiere Agreement y API-Key.' }, { status: 400 })
  const ok = await saveIntegrationCredential({ userId: user.id, provider, accessToken: apiKey, providerUserId: sellerId || null, contract: agreement, clientCode: sellerId || null, apiKey })
  return ok ? NextResponse.json({ connected: true }) : NextResponse.json({ error: 'No se pudieron guardar las credenciales de Correo Argentino.' }, { status: 503 })
}

export async function DELETE(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params
  if (!validProvider(provider)) return NextResponse.json({ error: 'Proveedor no válido.' }, { status: 404 })
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const ok = await deleteIntegrationCredential(user.id, provider)
  return ok ? NextResponse.json({ connected: false }) : NextResponse.json({ error: 'No se pudo desconectar el proveedor.' }, { status: 503 })
}
