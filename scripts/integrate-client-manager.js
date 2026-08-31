const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const importLine = "import ClientManagerV2 from '../components/ClientManagerV2'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

const oldSection = `{section==='clientes'&&<section className="two-col"><div className="panel"><h2>Clientes</h2>{clients.map(c=><div className="client-row" key={c.id}><strong>{c.name}</strong><small>{c.contact}</small></div>)}{!clients.length&&<div className="empty-state">Todavía no hay clientes.</div>}</div><form className="panel form-panel" onSubmit={addClient}><h2>Nuevo cliente</h2><input name="name" placeholder="Nombre y apellido"/><input name="contact" placeholder="WhatsApp, teléfono o correo"/><button className="primary-btn">Agregar cliente</button></form></section>}`
const newSection = `{section==='clientes'&&<ClientManagerV2 clients={clients} orders={orders} sales={sales} onChange={setClients} onNotice={setNotice}/>`

if (source.includes(oldSection)) {
  source = source.replace(oldSection, newSection)
} else if (!source.includes('<ClientManagerV2 clients={clients}')) {
  throw new Error('No se encontró el apartado Clientes esperado en app/page.tsx; no se aplicó ningún cambio.')
}

fs.writeFileSync(file, source)
console.log('Clientes conectado correctamente.')
