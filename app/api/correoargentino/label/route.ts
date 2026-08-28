import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, 'correoargentino')
  if (!credential?.apiKey || !credential.contract) return NextResponse.json({ error: 'Configurá la cuenta de Correo Argentino del negocio.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const orders = Array.isArray(body) ? body : Array.isArray(body?.orders) ? body.orders : []
  if (!orders.length) return NextResponse.json({ error: 'Indicá sellerId y trackingNumber para obtener la etiqueta.' }, { status: 400 })

  const format = body?.labelFormat === 'label' ? 'label' : '10x15'
  const endpoint = new URL('https://api.correoargentino.com.ar/paqar/v1/labels')
  endpoint.searchParams.set('labelFormat', format)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Apikey ${credential.apiKey}`, agreement: credential.contract, 'Content-Type': 'application/json' },
    body: JSON.stringify(orders.map((item: any) => ({ sellerId: String(item.sellerId || credential.clientCode || ''), trackingNumber: String(item.trackingNumber || '') }))),
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return NextResponse.json({ error: data.message || data.error || 'No se pudo obtener la etiqueta de Correo Argentino.' }, { status: response.status })

  return NextResponse.json({ labels: data })
}
