import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  console.log('Mercado Pago webhook recibido', payload)
  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'mercadopago-webhook' })
}
