import { NextResponse } from 'next/server'
import { deleteIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export async function POST(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })

  const ok = await deleteIntegrationCredential(user.id, 'mercadopago')
  if (!ok) return NextResponse.json({ error: 'No se pudo desconectar Mercado Pago.' }, { status: 503 })
  return NextResponse.json({ connected: false })
}
