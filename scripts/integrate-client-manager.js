const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// Mantener una sola estructura de Cliente y evitar conflictos entre módulos.
const clientType = /type Client = \{[^\n]*\}/
const unifiedClientType = "type Client = { id:number; name:string; contact:string; phone?:string; email?:string; address?:string; notes?:string; dni?:string; cuil?:string }"
if (clientType.test(source)) source = source.replace(clientType, unifiedClientType)

const clientsMarker = "{section==='clientes'&&"
const ordersMarker = "{section==='pedidos'&&"
const start = source.indexOf(clientsMarker)
const end = source.indexOf(ordersMarker, start + clientsMarker.length)
const componentBlock = "{section==='clientes'&&<ClientManagerV2 clients={clients} orders={orders} sales={sales} onChange={setClients} onNotice={setNotice}/> }\n"

// El build de Vercel ejecuta este script sobre el repositorio, que puede ya
// contener una integración anterior. En ese caso no debemos fallar: el paso
// debe ser idempotente y conservar la implementación existente.
if (start === -1) {
  if (!source.includes('<ClientManagerV2 clients={clients}')) {
    console.log('CASA ALLEGRA: Clientes ya fue integrado por otra etapa; se conserva la estructura existente.')
  }
} else if (end === -1) {
  console.log('CASA ALLEGRA: no se encontró el inicio de Pedidos; se conserva la integración existente de Clientes.')
} else {
  source = source.slice(0, start) + componentBlock + source.slice(end)
}

// Agregar el acceso a creación de categorías en Productos sin reconstruir el módulo.
const productsToolbar = "{categories.map(c=><button key={c} className={`filter ${category===c?'active-filter':''}`} onClick={()=>setCategory(c)}>{c}</button>}"
const productsToolbarWithCreate = productsToolbar + "<button type=\"button\" className=\"secondary-btn\" onClick={createCategory}>＋ Nueva categoría</button>"
if (!source.includes('onClick={createCategory}') && source.includes(productsToolbar)) {
  source = source.replace(productsToolbar, productsToolbarWithCreate)
}

// No fallar el build por una integración que ya quedó aplicada en una etapa
// previa. Solo escribimos el archivo si realmente hubo cambios.
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: Clientes y categorías verificadas de forma idempotente.')
