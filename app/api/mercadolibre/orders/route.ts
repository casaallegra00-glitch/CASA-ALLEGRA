import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, 'mercadolibre')
  if (!credential?.accessToken || !credential.providerUserId) return NextResponse.json({ error: 'Conectá la cuenta de Mercado Libre del negocio.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const limit = Math.min(50, Math.max(1, Number(params.get('limit') || 20)))
  const status = params.get('status') || 'paid'
  const url = new URL('https://api.mercadolibre.com/orders/search')
  url.searchParams.set('seller', String(credential.providerUserId))
  url.searchParams.set('order.status', status)
  url.searchParams.set('sort', 'date_desc')
  url.searchParams.set('limit', String(limit))

  const response = await fetch(url, { headers: { Authorization: `Bearer ${credential.accessToken}` }, cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return NextResponse.json({ error: data.message || data.error || 'Mercado Libre rechazó la consulta de ventas.' }, { status: response.status })

  return NextResponse.json({
    total: data.paging?.total ?? data.results?.length ?? 0,
    orders: (Array.isArray(data.results) ? data.results : []).map((order: any) => ({
      id: order.id,
      status: order.status,
      dateCreated: order.date_created,
      dateClosed: order.date_closed,
      total: order.total_amount,
      currency: order.currency_id,
      buyer: {
        id: order.buyer?.id ?? null,
        nickname: order.buyer?.nickname ?? null,
        firstName: order.buyer?.first_name ?? null,
        lastName: order.buyer?.last_name ?? null,
        email: order.buyer?.email ?? null,
      },
      items: (order.order_items || []).map((item: any) => ({
        id: item.item?.id ?? null,
        title: item.item?.title ?? null,
        quantity: item.quantity ?? 0,
        unitPrice: item.unit_price ?? null,
      })),
      payments: (order.payments || []).map((payment: any) => ({ id: payment.id, status: payment.status, transactionAmount: payment.transaction_amount })),
    })),
  })
}
