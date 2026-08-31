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
        stream: true,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
        max_tokens: 450,
      }),
    })

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}))
      const message = data?.error?.message || data?.message || 'No pudimos obtener una respuesta de ANGI.'
      return NextResponse.json({ error: message }, { status: response.status || 502 })
    }

    const encoder = new TextEncoder()
    const upstream = response.body
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const raw of lines) {
              const line = raw.trim()
              if (!line.startsWith('data:')) continue
              const payload = line.slice(5).trim()
              if (payload === '[DONE]') continue
              try {
                const parsed = JSON.parse(payload)
                const token = parsed?.choices?.[0]?.delta?.content
                if (typeof token === 'string' && token) {
                  controller.enqueue(encoder.encode(token))
                }
              } catch {}
            }
          }
          if (buffer.startsWith('data:')) {
            const payload = buffer.slice(5).trim()
            if (payload && payload !== '[DONE]') {
              try {
                const parsed = JSON.parse(payload)
                const token = parsed?.choices?.[0]?.delta?.content
                if (typeof token === 'string' && token) controller.enqueue(encoder.encode(token))
              } catch {}
            }
          }
          controller.close()
        } catch {
          controller.error(new Error('ANGI perdió la conexión con el proveedor de IA.'))
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch {
    return NextResponse.json({ error: 'No pudimos conectar con ANGI. Intentá nuevamente.' }, { status: 500 })
  }
}

// Deploy trigger: OpenRouter Free para ANGI