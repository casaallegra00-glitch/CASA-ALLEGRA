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
if(!source.includes('<IntegrationManager storageKey='))throw new Error('No se pudo conectar IntegrationManager.')
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: centro de Integraciones integrado.')
