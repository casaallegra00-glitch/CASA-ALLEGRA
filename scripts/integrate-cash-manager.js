const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')
const importLine = "import CashManager from '../components/CashManager'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}
const startMarker = "{section==='caja'&&"
const endMarker = "{section==='reportes'&&"
const start = source.indexOf(startMarker)
const end = source.indexOf(endMarker, start + startMarker.length)
if (start === -1 || end === -1) throw new Error('No se encontró el bloque visual de Caja.')
const block = "{section==='caja'&&<CashManager cash={cash} onChange={setCash} onNotice={setNotice}/> }\n"
source = source.slice(0, start) + block + source.slice(end)
if (!source.includes('<CashManager cash={cash}')) throw new Error('No se pudo integrar CashManager.')
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: módulo completo de Caja integrado.')
