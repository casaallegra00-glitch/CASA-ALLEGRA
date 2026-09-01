const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')
const importLine = "import ReportsManager from '../components/ReportsManager'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}
const homeImport = "import HomeDashboard from '../components/HomeDashboard'"
if (!source.includes(homeImport)) {
  source = source.replace("import ReportsManager from '../components/ReportsManager'", "import ReportsManager from '../components/ReportsManager'\n" + homeImport)
}
const quickEffect = " useEffect(()=>{const ids:Record<string,string>={productos:'quick-product-form',clientes:'quick-client-form',pedidos:'quick-order-form',caja:'quick-cash-form'};const id=ids[section];if(id&&userEmail){window.setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}},[section,userEmail])\n"
if (!source.includes("quick-product-form")) {
  const marker = " useEffect(()=>{if(!userEmail&&section!=='inicio')setSection('inicio')},[userEmail,section]);"
  source = source.replace(marker, marker + quickEffect)
}
source = source.replace('<form className="panel form-panel" onSubmit={addProduct}>','<form id="quick-product-form" className="panel form-panel" onSubmit={addProduct}>')
source = source.replace('<form className="panel form-panel" onSubmit={addClient}>','<form id="quick-client-form" className="panel form-panel" onSubmit={addClient}>')
source = source.replace('<form className="panel form-panel" onSubmit={addOrder}>','<form id="quick-order-form" className="panel form-panel" onSubmit={addOrder}>')
source = source.replace('<div className="panel"><h2>Movimientos</h2><form onSubmit={addCash(\'ingreso\')}','<div id="quick-cash-form" className="panel"><h2>Movimientos</h2><form onSubmit={addCash(\'ingreso\')}')
const homeMarker = "{section==='inicio'&&"
const homeNextMarker = "{section==='productos'&&"
const homeStart = source.indexOf(homeMarker)
const homeEnd = source.indexOf(homeNextMarker, homeStart + homeMarker.length)
if (homeStart === -1 || homeEnd === -1) throw new Error('No se encontró el bloque de Inicio.')
const homeReplacement = "{section==='inicio'&&<><HomeDashboard products={products} sales={sales} orders={orders} cash={cash} onNavigate={(s)=>goTo(s as Section)}/></>}\n"
source = source.slice(0, homeStart) + homeReplacement + source.slice(homeEnd)
const marker = "{section==='reportes'&&"
const nextMarker = "{section==='integraciones'&&"
const start = source.indexOf(marker)
const end = source.indexOf(nextMarker, start + marker.length)
if (start === -1 || end === -1) throw new Error('No se encontró el bloque de Reportes.')
const replacement = "{section==='reportes'&&<ReportsManager sales={sales} cash={cash} products={products} clients={clients} orders={orders}/> }\n"
source = source.slice(0, start) + replacement + source.slice(end)
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: accesos rápidos funcionales con navegación y desplazamiento al formulario.')
