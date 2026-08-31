const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const required = "type Order = { id:number; number:string; client:string; detail:string; status:string; amount:number; date:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
const optional = "type Order = { id:number; number?:string; client:string; detail:string; status:string; amount:number; date:string; clientId?:number; items?:Array<{productId:number;name:string;quantity:number;unitPrice:number;total:number}>; discount?:number; payment?:string; deliveryDate?:string; notes?:string }"
if (source.includes(required)) source = source.replace(required, optional)
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: compatibilidad de pedidos antiguos corregida (number opcional).')
