const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const needle = "const key=userEmail.toLowerCase().trim(); const base=`casa-allegra-${key||'guest'}`;"
if (!source.includes(needle)) {
  throw new Error('CASA ALLEGRA: no se encontró el punto de integración de sincronización. El build se detiene para evitar publicar una app sin nube.')
}

const startMarker = ' // CASA ALLEGRA UNIVERSAL CLOUD SYNC: sincroniza TODO el historial guardado en localStorage de todas las herramientas.'
const endMarker = '},[userEmail,base]);'
const existingStart = source.indexOf(startMarker)
if (existingStart !== -1) {
  const existingEnd = source.indexOf(endMarker, existingStart)
  if (existingEnd === -1) throw new Error('CASA ALLEGRA: bloque de sincronización incompleto.')
  source = source.slice(0, existingStart) + source.slice(existingEnd + endMarker.length)
}

const injected = `const key=userEmail.toLowerCase().trim(); const base=\`casa-allegra-\${key||'guest'}\`;
 // CASA ALLEGRA UNIVERSAL CLOUD SYNC: sincroniza TODO el historial guardado en localStorage de todas las herramientas.
 useEffect(()=>{if(!userEmail||!supabase)return;let cancelled=false;let timer:number|undefined;let syncing=false;const prefix='casa-allegra-';const legacyKeys=['casa-allegra-products','casa-allegra-sales','casa-allegra-clients','casa-allegra-orders','casa-allegra-cash','casa-allegra-categories','casa-allegra-business','casa-allegra-cost-calculations'];const snapshot=()=>{const out:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(prefix)&&k!=='casa-allegra-cloud-last-snapshot'&&k!=='casa-allegra-zero-data-v1')out[k]=localStorage.getItem(k)||''}return out};const migrateLegacy=()=>{for(const k of legacyKeys){const v=localStorage.getItem(k);if(v==null)continue;const suffix=k.slice(prefix.length);const target=\`\${base}-\${suffix}\`;if(!localStorage.getItem(target)||localStorage.getItem(target)==='[]'||localStorage.getItem(target)==='0'||localStorage.getItem(target)==='""')try{localStorage.setItem(target,v)}catch{}}};const merge=(local:Record<string,string>,cloud:Record<string,string>)=>{const out={...cloud,...local};for(const k of new Set([...Object.keys(cloud),...Object.keys(local)])){const lv=local[k],cv=cloud[k];if(lv==null){out[k]=cv;continue}if(cv==null){out[k]=lv;continue}try{const l=JSON.parse(lv),c=JSON.parse(cv);if(Array.isArray(l)&&Array.isArray(c)){const all=[...c,...l];const seen=new Set<string>();const merged:any[]=[];for(const item of all){const id=item&&typeof item==='object'?(item.id??item.number??item.sku??null):null;const sig=id!=null?String(id):JSON.stringify(item);if(!seen.has(sig)){seen.add(sig);merged.push(item)}}out[k]=JSON.stringify(merged)}else{out[k]=lv||cv}}catch{out[k]=lv||cv}}return out};const write=(data:Record<string,string>)=>{for(const [k,v] of Object.entries(data)){try{if(localStorage.getItem(k)!==v)localStorage.setItem(k,v)}catch{}}};const getCloud=async()=>{const {data:u}=await supabase.auth.getUser();const uid=u.user?.id;if(!uid)return null;const result:any=await supabase.from('business_state').select('payload,updated_at').eq('user_id',uid).maybeSingle();if(result.error)throw result.error;const row=result.data as any;return {uid,payload:row?.payload||null}};const push=async(data:Record<string,string>,uid:string)=>{const payload={version:3,storage:data};const result:any=await supabase.from('business_state').upsert({user_id:uid,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(result.error)throw result.error};const syncNow=async()=>{if(cancelled||syncing)return;syncing=true;try{migrateLegacy();const local=snapshot();const cloud=await getCloud();if(!cloud)return;const cloudStorage=cloud.payload?.storage&&typeof cloud.payload.storage==='object'?cloud.payload.storage:{};const merged=merge(local,cloudStorage);write(merged);await push(snapshot(),cloud.uid);sessionStorage.setItem('casa-allegra-cloud-last-snapshot',JSON.stringify(snapshot()))}catch(err){console.warn('CASA ALLEGRA: sincronización universal no disponible.',err)}finally{syncing=false}};const start=async()=>{await syncNow();timer=window.setInterval(async()=>{if(document.visibilityState!=='visible'||syncing)return;try{const local=snapshot();const last=sessionStorage.getItem('casa-allegra-cloud-last-snapshot');if(last!==JSON.stringify(local))await syncNow()}catch(err){console.warn('CASA ALLEGRA: error guardando historial en la nube.',err)}},1500)};start();const refresh=()=>{if(document.visibilityState==='visible')syncNow()};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{cancelled=true;if(timer)window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[userEmail,base]);`

source = source.replace(needle, injected)
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: sincronización universal integrada correctamente.')
