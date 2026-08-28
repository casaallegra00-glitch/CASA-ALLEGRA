import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) return NextResponse.json({ ok: false, supabase_env: false, database: false }, { status: 503 })

  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await supabase.from('integration_connections').select('id').limit(1)

  return NextResponse.json({ ok: !error, supabase_env: true, database: !error, database_error: error ? error.message : null }, { status: error ? 503 : 200 })
}
