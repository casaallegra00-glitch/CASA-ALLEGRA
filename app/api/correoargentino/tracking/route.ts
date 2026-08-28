import { NextResponse } from 'next/server'
import { getIntegrationCredential, getUserFromBearer } from '@/lib/integration-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Iniciá sesión en CASA ALLEGRA.' }, { status: 401 })
  const credential = await getIntegrationCredential(user.id, 'correoargentino')
  if (!credential?.apiKey || !credential.contract) return NextResponse.json({ error: 'Configurá la cuenta de Correo Argentino del negocio.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const trackingNumbers = (params.get('trackingNumbers') || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!trackingNumbers.length) return NextResponse.json({ error: 'Ingresá al menos un tracking number.' }, { status: 400 })

  const extClient = (params.get('extClient') || '000').replace(/\D/g, '').slice(0, 3).padStart(3, '0')
  const endpoint = new URL('https://api.correoargentino.com.ar/paqar/v1/tracking')
  endpoint.searchParams.set('extClient', extClient)
  endpoint.searchParams.set('trackingNumber', trackingNumbers.join(','))

  const response = await fetch(endpoint, { headers: { Authorization: `Apikey ${credential.apiKey}`, agreement: credential.contract }, cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return NextResponse.json({ error: data.message || data.error || 'Correo Argentino rechazó la consulta.' }, { status: response.status })
  return NextResponse.json({ tracking: data })
}
