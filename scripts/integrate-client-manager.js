const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// Reemplazamos únicamente el bloque de Clientes entre sus marcadores de sección.
// Esto evita depender de contar etiquetas </section> y no toca Productos, Ventas, Caja ni Pedidos.
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
console.log('Clientes conectado correctamente al módulo principal.')
