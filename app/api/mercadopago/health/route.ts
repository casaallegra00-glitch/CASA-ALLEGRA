import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ connected: false, configured: false, message: 'Falta MERCADOPAGO_ACCESS_TOKEN en Vercel.' }, { status: 200 })
  }

  const response = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json({ connected: false, configured: true, message: 'El Access Token de Mercado Pago no fue aceptado.' }, { status: 200 })
  }

  const data = await response.json()
  return NextResponse.json({
    connected: true,
    configured: true,
    userId: data.id ?? null,
    nickname: data.nickname ?? null,
    siteId: data.site_id ?? null,
  })
}
