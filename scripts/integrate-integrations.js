const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const importLine="import IntegrationManager from '../components/IntegrationManager'"
if(!source.includes(importLine)){
 source=source.replace("import { createClient } from '@supabase/supabase-js'","import { createClient } from '@supabase/supabase-js'\n"+importLine)
}
const sectionMatch=source.match(/type Section = 'inicio'[^\n]*/)
if(sectionMatch&&!sectionMatch[0].includes("'proveedores'")){
 source=source.replace(sectionMatch[0],sectionMatch[0].replace("'configuracion'","'proveedores'|'configuracion'"))
}
const marker="{section==='integraciones'&&"
const nextMarkers=["{section==='ia'&&","{section==='notificaciones'&&","{section==='configuracion'&&","{section==='ayuda'&&"]
const start=source.indexOf(marker)
if(start===-1)throw new Error('No se encontró el bloque de Integraciones.')
const ends=nextMarkers.map(m=>source.indexOf(m,start+marker.length)).filter(i=>i>=0)
const end=ends.length?Math.min(...ends):source.indexOf('</main>',start)
if(end<0)throw new Error('No se encontró el final del bloque de Integraciones.')
const replacement="{section==='integraciones'&&<IntegrationManager storageKey={`${base}-integraciones`} onNotice={setNotice}/> }\n"
source=source.slice(0,start)+replacement+source.slice(end)

// OAuth puede volver mientras Supabase todavía está restaurando la sesión. No forzar Inicio.
const queryGuard="useEffect(()=>{if(!userEmail&&section!=='inicio')setSection('inicio')},[userEmail,section]);"
if(source.includes(queryGuard))source=source.replace(queryGuard,'')
const queryEffect="useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('section');if(requested==='integraciones'&&userEmail)setSection('integraciones')},[userEmail]);"
if(!source.includes("requested==='integraciones'")){
 const anchor="useEffect(()=>{if(!supabase)return;"
 const idx=source.indexOf(anchor)
 if(idx>=0)source=source.slice(0,idx)+queryEffect+' '+source.slice(idx)
}
fs.writeFileSync(file,source)

const managerFile=path.join(process.cwd(),'components','IntegrationManager.tsx')
if(fs.existsSync(managerFile)){
 let manager=fs.readFileSync(managerFile,'utf8')
 const oldGuard="if(key==='mercadopago'&&!connected.mercadopago){window.location.href=mpConfigured?'/api/integrations/mercadopago/connect':'/';return}"
 const newGuard="if(key==='mercadopago'&&!connected.mercadopago){if(!configured.mercadopago){onNotice('Mercado Pago todavía no está configurado en el servidor. Configurá las credenciales OAuth en Vercel.');return}connectMercadoPago();return}"
 if(manager.includes(oldGuard)&&!manager.includes(newGuard))manager=manager.replace(oldGuard,newGuard)
 const duplicateButton="{active==='mercadopago'&&!connected.mercadopago&&<button type='button' className='primary-btn' onClick={connectMercadoPago} disabled={loading}>Conectar Mercado Pago</button>}"
 // There is intentionally only one MP connect button in the manager.
 const callbackFile=path.join(process.cwd(),'app','api','integrations','mercadopago','callback','route.ts')
 fs.writeFileSync(managerFile,manager)
 if(fs.existsSync(callbackFile)){
  let callback=fs.readFileSync(callbackFile,'utf8')
  const oldBack="const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('integration','mercadopago')"
  const newBack="const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('section','integraciones');back.searchParams.set('integration','mercadopago')"
  if(callback.includes(oldBack)&&!callback.includes(newBack))callback=callback.replace(oldBack,newBack)
  fs.writeFileSync(callbackFile,callback)
 }
}
console.log('CASA ALLEGRA: flujo OAuth de Mercado Pago sin redirección forzada a Inicio.')
