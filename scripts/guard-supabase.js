const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const unsafe = `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL\nconst supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY\nconst supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null`
const safe = `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL\nconst supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY\nlet supabase: ReturnType<typeof createClient> | null = null\ntry {\n  if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey)\n} catch (error) {\n  console.warn('CASA ALLEGRA: configuración de Supabase no válida; la app continúa en modo local.', error)\n}`

if (source.includes(unsafe)) {
  source = source.replace(unsafe, safe)
  fs.writeFileSync(file, source)
  console.log('CASA ALLEGRA: inicialización de Supabase protegida.')
} else if (source.includes('let supabase: ReturnType<typeof createClient> | null = null')) {
  console.log('CASA ALLEGRA: Supabase ya está protegido.')
} else {
  throw new Error('CASA ALLEGRA: no se encontró la inicialización esperada de Supabase.')
}
