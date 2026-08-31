const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

// 1) Estado del cliente seleccionado para la venta.
const stateNeedle = "const [clients,setClients]=useState<Client[]>([]);"
if (!source.includes("selectedSaleClient")) {
  if (!source.includes(stateNeedle)) throw new Error('No se encontró el estado de clientes; no se aplicó ningún cambio.')
  source = source.replace(stateNeedle, stateNeedle + " const [selectedSaleClient,setSelectedSaleClient]=useState('');")
}

// 2) Alta rápida desde Ventas. Se crea el cliente con sus datos completos mediante un formulario nativo.
const marker = " const registerSale=(p:Product,quantity=1,payment='Efectivo')=>"
if (!source.includes("const quickAddClientFromSale")) {
  const quickAdd = ` const quickAddClientFromSale=()=>{\n  const name=window.prompt('Nombre y apellido del nuevo cliente');\n  if(!name?.trim())return;\n  const dni=window.prompt('DNI (opcional)')||'';\n  const cuil=window.prompt('CUIL (opcional)')||'';\n  const phone=window.prompt('WhatsApp / teléfono (opcional)')||'';\n  const email=window.prompt('Email (opcional)')||'';\n  const address=window.prompt('Dirección (opcional)')||'';\n  const notes=window.prompt('Notas (opcional)')||'';\n  const newClient={id:Date.now(),name:name.trim(),dni:dni.trim(),cuil:cuil.trim(),contact:phone.trim(),phone:phone.trim(),email:email.trim(),address:address.trim(),notes:notes.trim()};\n  setClients(c=>[newClient,...c]);\n  setSelectedSaleClient(String(newClient.id));\n  setNotice('Cliente creado y seleccionado para esta venta.');\n };\n`
  if (!source.includes(marker)) throw new Error('No se encontró registerSale; no se aplicó ningún cambio.')
  source = source.replace(marker, quickAdd + marker)
}

// 3) Registrar la venta vinculada al cliente seleccionado.
const oldSale = "const registerSale=(p:Product,quantity=1,payment='Efectivo')=>{if(quantity<1||!Number.isInteger(quantity)){setNotice('La cantidad debe ser un número entero mayor a 0.');return}if(quantity>p.stock){setNotice(`Stock insuficiente. Solo hay ${p.stock} ${p.unit||'unidad'} disponibles.`);return}const total=p.price*quantity;const now=new Date().toISOString();setSales(s=>[{id:Date.now(),date:now,product:p.name,amount:total,quantity,payment},...s]);setProducts(ps=>ps.map(x=>x.id===p.id?{...x,stock:x.stock-quantity}:x));setCash(c=>[{id:Date.now()+1,type:'ingreso',detail:`Venta: ${p.name} x${quantity} · ${payment}`,amount:total,date:now},...c]);setNotice(`✅ Venta registrada: ${p.name} · ${quantity} unidad${quantity===1?'':'es'} · ${money(total)}`)};"
const newSale = "const registerSale=(p:Product,quantity=1,payment='Efectivo')=>{if(!selectedSaleClient){setNotice('Seleccioná un cliente antes de registrar la venta. Si no existe, usá Nuevo cliente.');return}if(quantity<1||!Number.isInteger(quantity)){setNotice('La cantidad debe ser un número entero mayor a 0.');return}if(quantity>p.stock){setNotice(`Stock insuficiente. Solo hay ${p.stock} ${p.unit||'unidad'} disponibles.`);return}const client=clients.find(c=>String(c.id)===selectedSaleClient);const total=p.price*quantity;const now=new Date().toISOString();setSales(s=>[{id:Date.now(),date:now,product:p.name,amount:total,quantity,payment,clientId:client?.id,clientName:client?.name},...s]);setProducts(ps=>ps.map(x=>x.id===p.id?{...x,stock:x.stock-quantity}:x));setCash(c=>[{id:Date.now()+1,type:'ingreso',detail:`Venta: ${p.name} x${quantity} · ${payment}${client?` · Cliente: ${client.name}`:''}`,amount:total,date:now},...c]);setNotice(`✅ Venta registrada: ${p.name} · ${quantity} unidad${quantity===1?'':'es'} · ${money(total)}${client?` · Cliente: ${client.name}`:''}`)};"
if (source.includes(oldSale)) source = source.replace(oldSale,newSale)
else if (!source.includes("clientName:client?.name")) throw new Error('No se encontró la función de registro de ventas esperada; no se aplicó ningún cambio.')

// 4) Reemplazar únicamente la sección de Ventas.
const startMarker = "{section==='ventas'&&"
const endMarker = "{section==='clientes'&&"
const start = source.indexOf(startMarker)
const end = source.indexOf(endMarker,start+startMarker.length)
if(start===-1||end===-1) throw new Error('No se encontró el bloque Ventas/Clientes; no se aplicó ningún cambio.')
const salesBlock = `{section==='ventas'&&<section className="panel large-section"><div className="panel-heading"><div><h2>Ventas</h2><small>Elegí el cliente antes de registrar la venta. Si no existe, podés crearlo acá.</small></div></div><div className="sale-client-bar"><div style={{flex:1}}><label>Cliente de la venta</label><select value={selectedSaleClient} onChange={e=>setSelectedSaleClient(e.target.value)}><option value="">Seleccionar cliente...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.dni?` · DNI ${c.dni}`:''}</option>)}</select></div><button type="button" className="secondary-btn" onClick={quickAddClientFromSale}>＋ Nuevo cliente</button></div>{products.length?<div className="product-grid sale-grid">{products.map(p=><SaleCard key={p.id} product={p} onSell={registerSale}/>)}</div>:<div className="empty-state">Primero agregá productos desde Productos.</div>}<div className="table sales-history"><h3>Historial de ventas</h3>{sales.slice(0,30).map(s=><div className="trow" key={s.id}><span><b>{s.product}</b><small>{s.quantity||1} unidad{(s.quantity||1)===1?'':'es'} · {s.payment||'Efectivo'}{s.clientName?` · Cliente: ${s.clientName}`:''}</small></span><span>{new Date(s.date).toLocaleString('es-AR')}</span><b>{money(s.amount)}</b></div>)}{!sales.length&&<div className="empty-state">Todavía no registraste ventas.</div>}</div></section>}`
source = source.slice(0,start) + salesBlock + source.slice(end)

fs.writeFileSync(file,source)
console.log('Ventas: selección de cliente y alta rápida conectadas correctamente.')
