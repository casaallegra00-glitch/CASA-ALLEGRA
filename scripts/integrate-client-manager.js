const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// Reemplaza cualquier versión del bloque antiguo de Clientes generado en page.tsx.
// Se busca desde el selector de sección hasta el cierre de su <section>, sin tocar los demás módulos.
const marker = "{section==='clientes'&&"
const markerIndex = source.indexOf(marker)
const componentCall = "{section==='clientes'&&<ClientManagerV2 clients={clients} orders={orders} sales={sales} onChange={setClients} onNotice={setNotice}/> }"

if (markerIndex !== -1) {
  const afterMarker = source.slice(markerIndex + marker.length)
  const sectionEnd = afterMarker.indexOf('</section>')
  if (sectionEnd !== -1) {
    source = source.slice(0, markerIndex) + componentCall + afterMarker.slice(sectionEnd + '</section>'.length)
  } else if (!source.includes('<ClientManagerV2 clients={clients}')) {
    throw new Error('No se encontró el cierre del apartado Clientes; no se aplicó ningún cambio.')
  }
}

// Si el componente ya está integrado, no hacemos nada destructivo.
if (!source.includes('<ClientManagerV2 clients={clients}')) {
  throw new Error('No se pudo conectar ClientManagerV2 al apartado Clientes; no se aplicó ningún cambio.')
}

fs.writeFileSync(file, source)
console.log('Clientes conectado correctamente al módulo principal.')
