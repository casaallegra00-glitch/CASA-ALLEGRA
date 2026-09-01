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
const queryGuard="useEffect(()=>{if(!userEmail&&section!=='inicio')setSection('inicio')},[userEmail,section]);"
const queryEffect="useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('section');if(requested==='integraciones'&&userEmail)setSection('integraciones')},[userEmail]);"
if(source.includes(queryGuard)&&!source.includes("requested==='integraciones'"))source=source.replace(queryGuard,queryGuard+' '+queryEffect)
fs.writeFileSync(file,source)

const managerFile=path.join(process.cwd(),'components','IntegrationManager.tsx')
if(fs.existsSync(managerFile)){
 let manager=fs.readFileSync(managerFile,'utf8')
 const oldGuard="if(key==='mercadopago'&&!connected.mercadopago){window.location.href=mpConfigured?'/api/integrations/mercadopago/connect':'/';return}"
 const newGuard="if(key==='mercadopago'&&!connected.mercadopago){if(!mpConfigured){onNotice('Mercado Pago todavía no está configurado. Revisá MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI y MP_TOKEN_ENCRYPTION_KEY en Vercel.');return}window.location.href='/api/integrations/mercadopago/connect';return}"
 if(manager.includes(oldGuard)&&!manager.includes(newGuard))manager=manager.replace(oldGuard,newGuard)
 const oldButton="<button type='button' className='secondary-btn' onClick={loadRemote.bind(null,'mercadopago')} disabled={!mpConfigured}>Conectar Mercado Pago</button>"
 const newButton="<button type='button' className='secondary-btn' onClick={()=>void loadRemote('mercadopago')}>Conectar Mercado Pago</button>"
 if(manager.includes(oldButton)&&!manager.includes(newButton))manager=manager.replace(oldButton,newButton)
 fs.writeFileSync(managerFile,manager)
}

const callbackFile=path.join(process.cwd(),'app','api','integrations','mercadopago','callback','route.ts')
if(fs.existsSync(callbackFile)){
 let callback=fs.readFileSync(callbackFile,'utf8')
 const oldBack="const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('integration','mercadopago')"
 const newBack="const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('section','integraciones');back.searchParams.set('integration','mercadopago')"
 if(callback.includes(oldBack)&&!callback.includes(newBack))callback=callback.replace(oldBack,newBack)
 fs.writeFileSync(callbackFile,callback)
}
console.log('CASA ALLEGRA: centro de Integraciones y flujo OAuth de Mercado Pago integrado correctamente.')