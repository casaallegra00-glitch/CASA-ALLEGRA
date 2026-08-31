const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// El tipo principal debe coincidir con ClientManagerV2: contact es obligatorio.
const oldClientTypes = [
  "type Client = { id:number; name:string; contact:string }",
  "type Client = { id:number; name:string; dni?:string; cuil?:string; contact?:string; phone?:string; email?:string; address?:string; notes?:string }"
]
const newClientType = "type Client = { id:number; name:string; contact:string; phone?:string; email?:string; address?:string; notes?:string; dni?:string; cuil?:string }"
for (const oldType of oldClientTypes) {
  if (source.includes(oldType)) source = source.replace(oldType, newClientType)
}

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
console.log('Clientes conectado correctamente al módulo principal con tipo Client compatible.')
