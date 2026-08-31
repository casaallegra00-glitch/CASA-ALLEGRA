const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import OrderManager from '../components/OrderManager'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

// El módulo de Pedidos y la pantalla principal deben compartir exactamente el mismo contrato.
// number es obligatorio en los pedidos nuevos; los demás datos enriquecidos son opcionales para
// mantener compatibilidad con pedidos antiguos guardados en localStorage.
const oldOrderType = "type Order = { id:number; client:string; detail:string; status:string; amount:number; date:string }"
const legacyEnrichedType = "type Order = { id:number; client:string; detail:string; status:string; amount:number; date:string; number?:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
const unifiedOrderType = "type Order = { id:number; number:string; client:string; detail:string; status:string; amount:number; date:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
if (source.includes(oldOrderType)) {
  source = source.replace(oldOrderType, unifiedOrderType)
} else if (source.includes(legacyEnrichedType)) {
  source = source.replace(legacyEnrichedType, unifiedOrderType)
}

const marker = "{section==='pedidos'&&"
const nextMarker = "{section==='caja'&&"
const start = source.indexOf(marker)
const end = source.indexOf(nextMarker, start + marker.length)
if (start === -1 || end === -1) throw new Error('No se encontró el bloque de Pedidos en page.tsx.')

const componentBlock = "{section==='pedidos'&&<OrderManager clients={clients} products={products} orders={orders} onClientsChange={setClients} onOrdersChange={setOrders} onNotice={setNotice}/> }\n"
source = source.slice(0, start) + componentBlock + source.slice(end)

if (!source.includes('<OrderManager clients={clients}')) throw new Error('No se pudo conectar OrderManager.')
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: módulo completo de Pedidos conectado con un único tipo Order compartido.')
