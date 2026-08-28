import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, 'mercadolibre')
  if (!credential?.accessToken) return NextResponse.json({ error: 'Conectá la cuenta de Mercado Libre del negocio.' }, { status: 401 })

  const orderId = new URL(request.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Falta orderId.' }, { status: 400 })

  const shipmentsResponse = await fetch(`https://api.mercadolibre.com/orders/${encodeURIComponent(orderId)}/shipments?list_all=true`, {
    headers: { Authorization: `Bearer ${credential.accessToken}`, 'X-New-Domain': 'true' },
    cache: 'no-store',
  })
  const shipmentsData = await shipmentsResponse.json().catch(() => ({}))
  if (!shipmentsResponse.ok) return NextResponse.json({ error: shipmentsData.message || shipmentsData.error || 'No se pudieron obtener los envíos.' }, { status: shipmentsResponse.status })

  const shipmentList = Array.isArray(shipmentsData) ? shipmentsData : []
  const details = await Promise.all(shipmentList.slice(0, 10).map(async (shipment: any) => {
    const id = shipment.id || shipment.shipment_id
    if (!id) return shipment
    const detailResponse = await fetch(`https://api.mercadolibre.com/shipments/${id}?views=destination,origin`, {
      headers: { Authorization: `Bearer ${credential.accessToken}`, 'x-format-new': 'true', 'X-Api-Version': '2' },
      cache: 'no-store',
    })
    const detail = await detailResponse.json().catch(() => ({}))
    return { ...shipment, detail: detailResponse.ok ? detail : null }
  }))

  return NextResponse.json({ shipments: details })
}
