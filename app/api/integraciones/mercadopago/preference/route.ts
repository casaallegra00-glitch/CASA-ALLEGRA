import { NextResponse } from 'next/server'
import { decryptJson, tokenCookie } from '@/lib/integration-oauth'

type Credential = {
  userId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  providerUserId?: string | number | null
}

function readCredential(request: Request) {
  const raw = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${tokenCookie('mercadopago')}=`))?.split('=').slice(1).join('=')
  return decryptJson<Credential>(raw)
}

export async function GET(request: Request) {
  const credential = readCredential(request)
  return NextResponse.json({
    ok: true,
    configured: Boolean(credential?.accessToken),
    connected: Boolean(credential?.accessToken),
    service: 'mercadopago',
  })
}

export async function POST(request: Request) {
  const credential = readCredential(request)

  if (!credential?.accessToken) {
    return NextResponse.json(
      { ok: false, error: 'Primero conectá tu propia cuenta de Mercado Pago.' },
      { status: 401 },
    )
  }

  try {
    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : [{ title: body?.title, quantity: body?.quantity, unit_price: body?.unit_price }]

    if (!items.length) {
      return NextResponse.json({ ok: false, error: 'Debe existir al menos un producto.' }, { status: 400 })
    }

    const normalizedItems = items.map((item: { id?: string; title?: string; quantity?: number; unit_price?: number }) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? 'Producto CASA ALLEGRA'),
      quantity: Math.max(1, Number(item.quantity ?? 1)),
      currency_id: 'ARS',
      unit_price: Number(item.unit_price ?? 0),
    }))

    if (normalizedItems.some((item: { unit_price: number }) => !Number.isFinite(item.unit_price) || item.unit_price <= 0)) {
      return NextResponse.json({ ok: false, error: 'Todos los productos deben tener un precio válido.' }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const externalReference = String(body?.external_reference ?? `casa-allegra-${Date.now()}`)

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: normalizedItems,
        external_reference: externalReference,
        back_urls: {
          success: `${origin}/?mercadopago=success`,
          failure: `${origin}/?mercadopago=failure`,
          pending: `${origin}/?mercadopago=pending`,
        },
        auto_return: 'approved',
      }),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: 'Mercado Pago rechazó la preferencia.', details: data?.message ?? data?.error ?? null },
        { status: response.status },
      )
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      external_reference: externalReference,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo conectar con Mercado Pago.' }, { status: 502 })
  }
}
