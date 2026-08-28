import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authorizationUrl, encryptJson } from '@/lib/integration-oauth'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: 'Ingresá a CASA ALLEGRA antes de conectar Mercado Libre.' }, { status: 401 })
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return NextResponse.json({ error: 'La sesión de CASA ALLEGRA no es válida.' }, { status: 401 })
  try {
    const state = encryptJson({ userId: data.user.id, provider: 'mercadolibre', createdAt: Date.now() })
    return NextResponse.json({ url: authorizationUrl('mercadolibre', request, state) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mercado Libre OAuth no está configurado.' }, { status: 503 })
  }
}
