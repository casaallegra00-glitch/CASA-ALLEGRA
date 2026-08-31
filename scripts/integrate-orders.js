const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import OrderManager from '../components/OrderManager'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// El módulo de Pedidos usa campos adicionales, pero todos son opcionales salvo los datos básicos.
const oldOrderType = "type Order = { id:number; client:string; detail:string; status:string; amount:number; date:string }"
const newOrderType = "type Order = { id:number; client:string; detail:string; status:string; amount:number; date:string; number?:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
if (source.includes(oldOrderType)) source = source.replace(oldOrderType, newOrderType)

const marker = "{section==='pedidos'&&"
const nextMarker = "{section==='caja'&&"
const start = source.indexOf(marker)
const end = source.indexOf(nextMarker, start + marker.length)
if (start === -1 || end === -1) throw new Error('No se encontró el bloque de Pedidos en page.tsx.')

const componentBlock = "{section==='pedidos'&&<OrderManager clients={clients} products={products} orders={orders} onClientsChange={setClients} onOrdersChange={setOrders} onNotice={setNotice}/> }\n"
source = source.slice(0, start) + componentBlock + source.slice(end)

if (!source.includes('<OrderManager clients={clients}')) throw new Error('No se pudo conectar OrderManager.')
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: módulo completo de Pedidos conectado correctamente.')
