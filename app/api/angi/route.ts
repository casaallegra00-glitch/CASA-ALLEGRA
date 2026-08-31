import { NextResponse } from 'next/server'

const model = process.env.ANGI_MODEL || 'openrouter/free'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    const context = body?.context ?? {}

    if (!question) {
      return NextResponse.json({ error: 'Escribí una consulta para ANGI.' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANGI necesita una clave gratuita de OpenRouter configurada en Vercel (OPENROUTER_API_KEY).' }, { status: 503 })
    }

    const instructions = `Sos ANGI, el asistente virtual de CASA ALLEGRA APP. Respondé en español argentino, de forma clara, práctica y amable. Ayudás a gestionar un negocio de papelería y gráfica creativa. Tenés acceso solamente a los datos que aparecen en CONTEXTO. Nunca inventes cifras, clientes, productos, ventas o movimientos. Si el contexto no alcanza, decilo claramente. Podés hacer cálculos simples con los datos recibidos. Priorizá respuestas útiles y concretas.\n\nCONTEXTO ACTUAL DEL NEGOCIO:\n${JSON.stringify(context)}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://casa-allegra.vercel.app',
        'X-Title': 'CASA ALLEGRA APP · ANGI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 700,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      const message = data?.error?.message || data?.message || 'No pudimos obtener una respuesta de ANGI.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const output = data?.choices?.[0]?.message?.content?.trim() || ''
    if (!output) {
      return NextResponse.json({ error: 'ANGI no recibió una respuesta de la IA.' }, { status: 502 })
    }

    return NextResponse.json({ answer: output })
  } catch {
    return NextResponse.json({ error: 'No pudimos conectar con ANGI. Intentá nuevamente.' }, { status: 500 })
  }
}
