import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')

    // Mercado Pago envía la firma en x-signature. La validación criptográfica
    // se habilita cuando se configure MERCADOPAGO_WEBHOOK_SECRET en Vercel.
    // No procesamos cambios de pedidos hasta validar el origen.
    if (!signature || !requestId) {
      return NextResponse.json({ ok: false, error: 'Webhook sin firma o request id.' }, { status: 400 })
    }

    console.info('Mercado Pago webhook recibido', {
      type: body?.type ?? null,
      action: body?.action ?? null,
      dataId: body?.data?.id ?? null,
      liveMode: body?.live_mode ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Webhook inválido.' }, { status: 400 })
  }
}
