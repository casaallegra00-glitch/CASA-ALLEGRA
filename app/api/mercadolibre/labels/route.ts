import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, 'mercadolibre')
  if (!credential?.accessToken) return NextResponse.json({ error: 'Conectá la cuenta de Mercado Libre del negocio.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const ids = (params.get('shipment_ids') || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!ids.length) return NextResponse.json({ error: 'Indicá al menos un shipment_id.' }, { status: 400 })
  if (ids.length > 50) return NextResponse.json({ error: 'Mercado Libre permite hasta 50 etiquetas por consulta.' }, { status: 400 })

  const format = params.get('format') === 'zpl2' ? 'zpl2' : 'pdf'
  const response = await fetch(`https://api.mercadolibre.com/shipment_labels?shipment_ids=${ids.map(encodeURIComponent).join(',')}&response_type=${format}`, {
    headers: { Authorization: `Bearer ${credential.accessToken}` },
    cache: 'no-store',
  })
  const bytes = await response.arrayBuffer()
  if (!response.ok) {
    const text = new TextDecoder().decode(bytes)
    return NextResponse.json({ error: text || 'No se pudo obtener la etiqueta de Mercado Envíos.' }, { status: response.status })
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') || (format === 'pdf' ? 'application/zip' : 'application/zip'),
      'Content-Disposition': `attachment; filename="casa-allegra-mercado-envios.${format === 'pdf' ? 'zip' : 'zip'}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
