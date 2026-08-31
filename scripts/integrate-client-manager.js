const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// Unificamos el tipo Client del módulo principal con ClientManagerV2.
// El contacto puede faltar en clientes nuevos y se agregan los campos completos.
const oldClientType = "type Client = { id:number; name:string; contact:string }"
const newClientType = "type Client = { id:number; name:string; dni?:string; cuil?:string; contact?:string; phone?:string; email?:string; address?:string; notes?:string }"
if (source.includes(oldClientType)) source = source.replace(oldClientType, newClientType)

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

if (!source.includes('<ClientManagerV2 clients={clients}')) {
  throw new Error('No se pudo conectar ClientManagerV2 al apartado Clientes; no se aplicó ningún cambio.')
}

fs.writeFileSync(file, source)
console.log('Clientes conectado correctamente al módulo principal y tipos unificados.')
