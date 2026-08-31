const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

// Los pedidos antiguos pueden no tener campos enriquecidos. Todos los campos agregados al módulo
// de Pedidos son opcionales en el tipo compartido; los pedidos nuevos los completan al guardarse.
const required = "type Order = { id:number; number:string; client:string; detail:string; status:string; amount:number; date:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
const optional = "type Order = { id:number; number?:string; client:string; detail:string; status:string; amount:number; date:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
if (source.includes(required)) source = source.replace(required, optional)

// Compatibilidad adicional si otro paso del build deja el descuento como obligatorio.
source = source.replace(/discount:number;/g, 'discount?:number;')

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: tipo Order unificado y descuento opcional para pedidos existentes.')
