const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

// Productos: validación explícita antes de guardar.
const productStart = source.indexOf(' const addProduct=')
const orderStart = source.indexOf(' const addOrder=', productStart)
if (productStart === -1 || orderStart === -1) throw new Error('No se encontraron las funciones de validación de Productos/Pedidos.')

const productFn = ` const addProduct=(e:FormEvent)=>{e.preventDefault();const f=e.currentTarget as HTMLFormElement;const name=f.querySelector<HTMLInputElement>('[name=name]')?.value.trim()||'';const enteredSku=f.querySelector<HTMLInputElement>('[name=sku]')?.value.trim()||'';const sku=enteredSku||generateSku(products);const cost=Number(f.querySelector<HTMLInputElement>('[name=cost]')?.value||0);const price=Number(f.querySelector<HTMLInputElement>('[name=price]')?.value||0);const stockValue=f.querySelector<HTMLInputElement>('[name=stock]')?.value.trim()||'';const stock=Number(stockValue);const minStockValue=f.querySelector<HTMLInputElement>('[name=minStock]')?.value.trim()||'';const minStock=Number(minStockValue||0);const cat=f.querySelector<HTMLSelectElement>('[name=category]')?.value||'';if(!name){setNotice('⚠️ Falta completar: Nombre del producto.');return}if(!cat){setNotice('⚠️ Falta completar: Categoría.');return}if(price<=0||!Number.isFinite(price)){setNotice('⚠️ Falta completar correctamente: Precio de venta. Debe ser mayor a $0.');return}if(stockValue===''||!Number.isFinite(stock)||stock<0){setNotice('⚠️ Falta completar correctamente: Stock actual.');return}if(cost<0||!Number.isFinite(cost)){setNotice('⚠️ El costo no puede ser negativo.');return}if(minStockValue!==''&&(minStock<0||!Number.isFinite(minStock))){setNotice('⚠️ El stock mínimo no puede ser negativo.');return}if(products.some(p=>(p.sku||'').toLowerCase()===sku.toLowerCase())){setNotice('⚠️ SKU REPETIDO: Ese SKU ya existe.');return}setProducts(p=>[...p,{id:Date.now(),name,category:cat,price,stock,sku,cost,minStock,unit:'unidad',active:true,catalog:true}]);f.reset();setNotice('✅ Producto agregado correctamente.')}`
source = source.slice(0, productStart) + productFn + source.slice(orderStart)

// Pedidos heredados: mantenerlos funcionando, pero exigir los datos mínimos y evitar fechas vencidas.
const addOrderStart = source.indexOf(' const addOrder=')
const addCashStart = source.indexOf(' const addCash=', addOrderStart)
if (addOrderStart === -1 || addCashStart === -1) throw new Error('No se encontró la función addOrder.')

const orderFn = ` const addOrder=(e:FormEvent)=>{e.preventDefault();const f=e.currentTarget as HTMLFormElement;const client=f.querySelector<HTMLInputElement>('[name=client]')?.value.trim()||'';const detail=f.querySelector<HTMLInputElement>('[name=detail]')?.value.trim()||'';const amountValue=f.querySelector<HTMLInputElement>('[name=amount]')?.value.trim()||'';const amount=Number(amountValue);const dateValue=f.querySelector<HTMLInputElement>('[name=date]')?.value||'';if(!client){setNotice('⚠️ Falta completar: Cliente.');return}if(!detail){setNotice('⚠️ Falta completar: Detalle del pedido.');return}if(amountValue===''||!Number.isFinite(amount)||amount<=0){setNotice('⚠️ Falta completar correctamente: Importe. Debe ser mayor a $0.');return}if(dateValue){const today=new Date();today.setHours(0,0,0,0);const chosen=new Date(dateValue+'T00:00:00');if(chosen<today){setNotice('⚠️ La fecha indicada ya pasó. Elegí una fecha de hoy o futura.');return}}const next={id:Date.now(),number:\`PED-\${new Date().getFullYear()}-\${String(orders.length+1).padStart(4,'0')}\`,client,detail,status:'Pendiente',amount,date:new Date().toISOString()};setOrders(o=>[next,...o]);f.reset();setNotice('✅ Pedido creado correctamente.')}`
source = source.slice(0, addOrderStart) + orderFn + source.slice(addCashStart)

// Agregamos min="hoy" al campo de fecha del formulario antiguo de pedidos, si existe.
const todayExpr = '<input name="date" type="date" />'
if (source.includes(todayExpr) && !source.includes('min={new Date().toISOString().slice(0,10)}')) {
  source = source.replace(todayExpr, '<input name="date" type="date" min={new Date().toISOString().slice(0,10)} />')
}

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: validaciones de campos obligatorios y fechas agregadas.')
