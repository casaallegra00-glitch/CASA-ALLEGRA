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

if (start === -1) {
  if (!source.includes('<ClientManagerV2 clients={clients}')) {
    throw new Error('No se encontró el apartado Clientes; no se aplicó ningún cambio.')
  }
} else if (end === -1) {
  throw new Error('No se encontró el inicio de Pedidos después de Clientes; no se aplicó ningún cambio.')
} else {
  source = source.slice(0, start) + componentBlock + source.slice(end)
}

// Agregar el acceso a creación de categorías en Productos sin reconstruir el módulo.
const productsToolbar = "{categories.map(c=><button key={c} className={`filter ${category===c?'active-filter':''}`} onClick={()=>setCategory(c)}>{c}</button>)}"
const productsToolbarWithCreate = productsToolbar + "<button type=\"button\" className=\"secondary-btn\" onClick={createCategory}>＋ Nueva categoría</button>"
if (!source.includes('onClick={createCategory}') && source.includes(productsToolbar)) {
  source = source.replace(productsToolbar, productsToolbarWithCreate)
}

if (!source.includes('<ClientManagerV2 clients={clients}')) {
  throw new Error('No se pudo conectar ClientManagerV2 al apartado Clientes; no se aplicó ningún cambio.')
}
if (!source.includes('onClick={createCategory}')) {
  throw new Error('No se pudo agregar el botón Nueva categoría en Productos; no se aplicó ningún cambio.')
}

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: Clientes integrado y creación de categorías habilitada en Productos.')
