const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const importLine="import HelpManager from '../components/HelpManager'"
if(!source.includes(importLine)){
 source=source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n"+importLine)
}
const oldSection="type Section = 'inicio'|'ventas'|'productos'|'clientes'|'caja'|'pedidos'|'reportes'|'integraciones'|'notificaciones'|'ia'|'ayuda'|'configuracion'"
const newSection="type Section = 'inicio'|'ventas'|'productos'|'clientes'|'caja'|'pedidos'|'presupuestos'|'reportes'|'integraciones'|'notificaciones'|'ia'|'ayuda'|'configuracion'"
if(source.includes(oldSection)) source=source.replace(oldSection,newSection)
const navNeedle="['pedidos','Pedidos','orders'],['caja','Caja','cash']"
if(!source.includes("['presupuestos','Presupuestos'")){
 const navWithBudget="['pedidos','Pedidos','orders'],['presupuestos','Presupuestos','orders'],['caja','Caja','cash']"
 if(source.includes(navNeedle)) source=source.replace(navNeedle,navWithBudget)
}
const helpNeedle="['ayuda','Ayuda','help']"
// Keep Help as the last menu item; only ensure it exists if the main nav was generated without it.
if(!source.includes(helpNeedle) && source.includes("][['ayuda'")){
 console.log('')
}
const helpBlock="{section==='ayuda'&&<HelpManager onGo={goTo} businessName={businessName||'CASA ALLEGRA APP'} storageKey={base}/> }"
const marker="{section==='ayuda'&&<section className=\"panel large-section\"><h2>Ayuda</h2><p>Administrá productos, ventas, clientes, pedidos, caja y reportes.</p></section>}"
if(source.includes(marker)) source=source.replace(marker,helpBlock)
const startMarker="{section==='inicio'&&<section className=\"welcome-card\"><div>"
if(source.includes(startMarker) && !source.includes('Primeros pasos')){
 const start=source.indexOf(startMarker)
 const close=source.indexOf('</section>}',start)
 if(close!==-1){
  const after=close+'</section>}'.length
  const original=source.slice(start,after)
  const onboarding="\n<div className=\"panel\" style={{marginTop:18}}><div className=\"panel-heading\"><div><span className=\"eyebrow\">GUIA INICIAL</span><h2>🚀 Primeros pasos</h2><small>Configurá CASA ALLEGRA APP y empezá a trabajar.</small></div><button type=\"button\" className=\"primary-btn\" onClick={()=>goTo('ayuda')}>Ver guía completa</button></div><p style={{marginBottom:0}}>Configurá tu negocio → agregá productos → clientes → registrá tu primera venta → creá un presupuesto → conocé ANGI.</p></div>"
  source=source.slice(0,after)+onboarding+source.slice(after)
 }
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Ayuda y Primeros pasos integrados.')
