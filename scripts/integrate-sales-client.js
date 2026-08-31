const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

// Guardamos quién es el cliente seleccionado para la venta.
const stateNeedle = "const [clients,setClients]=useState<Client[]>([]);"
const stateInsert = "const [clients,setClients]=useState<Client[]>([]); const [saleClientId,setSaleClientId]=useState<number|null>(null); const [newSaleClient,setNewSaleClient]=useState(false);"
if (!source.includes('saleClientId')) {
  if (!source.includes(stateNeedle)) throw new Error('No se encontró el estado de clientes en page.tsx.')
  source = source.replace(stateNeedle, stateInsert)
}

// Una venta conserva el cliente asociado. Las ventas anteriores siguen siendo válidas.
source = source.replace(
  /type Sale = \{ id:number; date:string; product:string; amount:number; quantity:number; payment:string \}/,
  "type Sale = { id:number; date:string; product:string; amount:number; quantity:number; payment:string; clientId?:number; clientName?:string }"
)

// La venta ahora exige elegir cliente o permite crear uno nuevo antes de vender.
const registerStart = source.indexOf(' const registerSale=')
const addClientStart = source.indexOf(' const addClient=', registerStart)
if (registerStart === -1 || addClientStart === -1) throw new Error('No se encontró el bloque de registro de ventas.')
const registerReplacement = ` const registerSale=(p:Product,quantity=1,payment='Efectivo')=>{if(!saleClientId){setNotice('Seleccioná un cliente antes de registrar la venta.');return}if(quantity<1||!Number.isInteger(quantity)){setNotice('La cantidad debe ser un número entero mayor a 0.');return}if(quantity>p.stock){setNotice(\`Stock insuficiente. Solo hay \${p.stock} \${p.unit||'unidad'} disponibles.\`);return}const client=clients.find(c=>c.id===saleClientId);if(!client){setNotice('El cliente seleccionado ya no existe.');return}const total=p.price*quantity;const now=new Date().toISOString();setSales(s=>[{id:Date.now(),date:now,product:p.name,amount:total,quantity,payment,clientId:client.id,clientName:client.name},...s]);setProducts(ps=>ps.map(x=>x.id===p.id?{...x,stock:x.stock-quantity}:x));setCash(c=>[{id:Date.now()+1,type:'ingreso',detail:\`Venta: \${p.name} x\${quantity} · \${client.name} · \${payment}\`,amount:total,date:now},...c]);setNotice(\`✅ Venta registrada para \${client.name}: \${p.name} · \${quantity} unidad\${quantity===1?'':'es'} · \${money(total)}\`)}`
source = source.slice(0, registerStart) + registerReplacement + source.slice(addClientStart)

// Reemplazamos solamente la vista de Ventas, sin tocar el resto de módulos.
const salesMarker = "{section==='ventas'&&"
const clientsMarker = "{section==='clientes'&&"
const salesStart = source.indexOf(salesMarker)
const clientsStart = source.indexOf(clientsMarker, salesStart + salesMarker.length)
if (salesStart === -1 || clientsStart === -1) throw new Error('No se encontró el bloque visual de Ventas.')
const salesBlock = `{section==='ventas'&&<section className="panel large-section"><div className="panel-heading"><div><h2>Ventas</h2><small>Elegí el cliente antes de registrar la venta. El cliente queda asociado al historial.</small></div></div><div className="panel form-panel" style={{marginBottom:18}}><label>Cliente *</label><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><select value={saleClientId??''} onChange={e=>setSaleClientId(e.target.value?Number(e.target.value):null)} style={{flex:1,minWidth:220}}><option value="">Seleccionar cliente...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.contact?\` · \${c.contact}\`:''}</option>)}</select><button type="button" className="secondary-btn" onClick={()=>setNewSaleClient(v=>!v)}>＋ Nuevo cliente</button></div>{newSaleClient&&<form onSubmit={e=>{e.preventDefault();const f=e.currentTarget as HTMLFormElement;const name=f.querySelector<HTMLInputElement>('[name=saleClientName]')?.value.trim()||'';const contact=f.querySelector<HTMLInputElement>('[name=saleClientContact]')?.value.trim()||'';if(!name){setNotice('Ingresá el nombre del nuevo cliente.');return}const id=Date.now();setClients(c=>[{id,name,contact},...c]);setSaleClientId(id);setNewSaleClient(false);setNotice(\`Cliente \${name} creado y seleccionado para la venta.\`);f.reset()}} className="form-panel" style={{marginTop:12}}><label>Nombre y apellido *</label><input name="saleClientName" placeholder="Ej.: María González" required/><label>WhatsApp / teléfono</label><input name="saleClientContact" placeholder="Ej.: 11 1234-5678"/><button className="primary-btn">Crear y seleccionar cliente</button></form>}{saleClientId&&<small style={{display:'block',marginTop:8}}>Cliente seleccionado: <b>{clients.find(c=>c.id===saleClientId)?.name||'—'}</b></small>}</div>{products.length?<div className="product-grid sale-grid">{products.map(p=><SaleCard key={p.id} product={p} onSell={registerSale}/>)}</div>:<div className="empty-state">Primero agregá productos desde Productos.</div>}<div className="table sales-history"><h3>Historial de ventas</h3>{sales.slice(0,30).map(s=><div className="trow" key={s.id}><span><b>{s.product}</b><small>{s.quantity||1} unidad{(s.quantity||1)===1?'':'es'} · {s.payment||'Efectivo'}{s.clientName?\` · Cliente: \${s.clientName}\`:' · Cliente no registrado'}</small></span><span>{new Date(s.date).toLocaleString('es-AR')}</span><b>{money(s.amount)}</b></div>)}{!sales.length&&<div className="empty-state">Todavía no registraste ventas.</div>}</div></section>}`
source = source.slice(0, salesStart) + salesBlock + source.slice(clientsStart)

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: selección de cliente agregada al módulo de Ventas.')
