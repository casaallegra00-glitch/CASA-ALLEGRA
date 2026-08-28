import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

type Payment = {
  id?: string | number
  date_created?: string
  date_approved?: string
  status?: string
  status_detail?: string
  currency_id?: string
  transaction_amount?: number
  net_received_amount?: number
  description?: string
  payment_method_id?: string
  payment_type_id?: string
  external_reference?: string | null
  payer?: {
    id?: string | number
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    identification?: { type?: string | null; number?: string | null }
    phone?: { area_code?: string | null; number?: string | null }
  }
}

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })

  const credential = await getIntegrationCredential(user.id, 'mercadopago')
  const token = credential?.accessToken
  if (!token) return NextResponse.json({ error: 'Conectá la cuenta de Mercado Pago del emprendimiento.' }, { status: 401 })

  const params = new URLSearchParams({
    sort: 'date_created',
    criteria: 'desc',
    range: 'date_created',
    begin_date: 'NOW-30DAYS',
    end_date: 'NOW',
    limit: '50',
    status: 'approved',
  })
  if (credential.providerUserId != null) params.set('collector.id', String(credential.providerUserId))

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${params.toString()}`, {
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json({ error: 'Mercado Pago no permitió consultar los cobros recibidos.', details: data }, { status: 502 })
    }

    const payments = Array.isArray(data.results) ? (data.results as Payment[]) : []
    const results = payments.map((payment) => ({
      id: payment.id ?? null,
      createdAt: payment.date_created ?? null,
      approvedAt: payment.date_approved ?? null,
      status: payment.status ?? null,
      statusDetail: payment.status_detail ?? null,
      currency: payment.currency_id ?? 'ARS',
      amount: Number(payment.transaction_amount ?? 0),
      netAmount: payment.net_received_amount == null ? null : Number(payment.net_received_amount),
      description: payment.description ?? null,
      paymentMethod: payment.payment_method_id ?? null,
      paymentType: payment.payment_type_id ?? null,
      externalReference: payment.external_reference ?? null,
      payer: {
        id: payment.payer?.id ?? null,
        email: payment.payer?.email ?? null,
        firstName: payment.payer?.first_name ?? null,
        lastName: payment.payer?.last_name ?? null,
        identification: payment.payer?.identification ?? null,
        phone: payment.payer?.phone ?? null,
      },
    }))

    const total = results.reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0)
    return NextResponse.json({
      connected: true,
      source: 'mercadopago',
      scope: 'payments_received',
      period: 'last_30_days',
      count: results.length,
      totalReceived: total,
      payments: results,
    })
  } catch {
    return NextResponse.json({ error: 'No fue posible comunicarse con Mercado Pago.' }, { status: 502 })
  }
}
