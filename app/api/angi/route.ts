import { NextResponse } from 'next/server'

const model = process.env.ANGI_MODEL || 'gpt-5.6-luna'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    const context = body?.context ?? {}

    if (!question) return NextResponse.json({ error: 'Escribí una consulta para ANGI.' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANGI necesita una clave de IA configurada en Vercel (OPENAI_API_KEY o AI_GATEWAY_API_KEY).' }, { status: 503 })
    }

    const baseUrl = process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1/responses'
      : 'https://ai-gateway.vercel.sh/v1/responses'

    const instructions = `Sos ANGI, el asistente virtual de CASA ALLEGRA APP. Respondé en español argentino, de forma clara, práctica y amable. Ayudás a gestionar un negocio de papelería y gráfica creativa. Tenés acceso solamente a los datos que aparecen en CONTEXTO. Nunca inventes cifras, clientes, productos, ventas o movimientos. Si el contexto no alcanza, decilo claramente. Podés hacer cálculos simples con los datos recibidos. Priorizá respuestas útiles y concretas.\n\nCONTEXTO ACTUAL DEL NEGOCIO:\n${JSON.stringify(context)}`

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions,
        input: question,
        max_output_tokens: 700,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      const message = data?.error?.message || data?.message || 'No pudimos obtener una respuesta de la IA.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const output = data?.output_text || data?.output?.flatMap((item: any) => item?.content || []).map((part: any) => part?.text).filter(Boolean).join('\n') || ''
    if (!output) return NextResponse.json({ error: 'ANGI no recibió una respuesta de la IA.' }, { status: 502 })

    return NextResponse.json({ answer: output })
  } catch {
    return NextResponse.json({ error: 'No pudimos conectar con ANGI. Intentá nuevamente.' }, { status: 500 })
  }
}
