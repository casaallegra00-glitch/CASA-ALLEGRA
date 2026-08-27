import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const token = process.env.mercadopago_access_token
  if (!token) {
    return NextResponse.json({ error: 'Mercado Pago no está configurado en Vercel.' }, { status: 503 })
  }

  let body: { title?: string; quantity?: number; unit_price?: number; external_reference?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const title = String(body.title || 'Compra CASA ALLEGRA').slice(0, 200)
  const quantity = Math.max(1, Number(body.quantity || 1))
  const unitPrice = Number(body.unit_price || 0)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return NextResponse.json({ error: 'El importe debe ser mayor que 0.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const payload = {
    items: [{ title, quantity, currency_id: 'ARS', unit_price: unitPrice }],
    external_reference: String(body.external_reference || `CASA-${Date.now()}`).slice(0, 256),
    back_urls: {
      success: `${origin}/integraciones?mp=success`,
      failure: `${origin}/integraciones?mp=failure`,
      pending: `${origin}/integraciones?mp=pending`,
    },
    auto_return: 'approved',
    notification_url: `${origin}/api/mercadopago/webhook`,
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json({ error: 'Mercado Pago rechazó la preferencia.', details: data }, { status: 502 })
    }

    return NextResponse.json({ id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point })
  } catch {
    return NextResponse.json({ error: 'No fue posible comunicarse con Mercado Pago.' }, { status: 502 })
  }
}
