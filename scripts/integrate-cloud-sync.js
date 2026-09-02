const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const needle = "const key=userEmail.toLowerCase().trim(); const base=`casa-allegra-${key||'guest'}`;"
if (!source.includes(needle)) {
  throw new Error('CASA ALLEGRA: no se encontró el punto de integración de sincronización.')
}

const startMarker = ' // CASA ALLEGRA UNIVERSAL CLOUD SYNC:'
const endMarker = '},[userEmail,base]);'
const existingStart = source.indexOf(startMarker)
if (existingStart !== -1) {
  const existingEnd = source.indexOf(endMarker, existingStart)
  if (existingEnd === -1) throw new Error('CASA ALLEGRA: bloque de sincronización incompleto.')
  source = source.slice(0, existingStart) + source.slice(existingEnd + endMarker.length)
}

const storageDeclaration = " const [storageReady,setStorageReady]=useState(false);"
if (!source.includes('const [storageReady,setStorageReady]')) {
  const cashStateRegex = /(const \[cash,setCash\]=useState<CashMove\[\]>\(\[\]\);)/
  if (!cashStateRegex.test(source)) throw new Error('CASA ALLEGRA: no se encontró el estado de Caja para insertar el estado de recuperación.')
  source = source.replace(cashStateRegex, `$1${storageDeclaration}`)
}

const savePattern = /useEffect\(\(\)=>save\(`\$\{base\}-products`,products\),\[base,products\]\); useEffect\(\(\)=>save\(`\$\{base\}-sales`,sales\),\[base,sales\]\); useEffect\(\(\)=>save\(`\$\{base\}-clients`,clients\),\[base,clients\]\); useEffect\(\(\)=>save\(`\$\{base\}-orders`,orders\),\[base,orders\]\); useEffect\(\(\)=>save\(`\$\{base\}-cash`,cash\),\[base,cash\]\); useEffect\(\(\)=>save\(`\$\{base\}-categories`,businessCategories\),\[base,businessCategories\]\);/
const guardedSave = "useEffect(()=>{if(!storageReady)return;save(`${base}-products`,products)},[base,products,storageReady]); useEffect(()=>{if(!storageReady)return;save(`${base}-sales`,sales)},[base,sales,storageReady]); useEffect(()=>{if(!storageReady)return;save(`${base}-clients`,clients)},[base,clients,storageReady]); useEffect(()=>{if(!storageReady)return;save(`${base}-orders`,orders)},[base,orders,storageReady]); useEffect(()=>{if(!storageReady)return;save(`${base}-cash`,cash)},[base,cash,storageReady]); useEffect(()=>{if(!storageReady)return;save(`${base}-categories`,businessCategories)},[base,businessCategories,storageReady]);"
if (savePattern.test(source)) source = source.replace(savePattern, guardedSave)

const oldLoad = "useEffect(()=>{if(!userEmail)return;setProducts(load(`${base}-products`,[]));setSales(load(`${base}-sales`,[]));setClients(load(`${base}-clients`,[]));setOrders(load(`${base}-orders`,[]));setCash(load(`${base}-cash`,[]));setBusinessCategories(load(`${base}-categories`,['General','Productos','Servicios','Otros']));const stored=load(`${base}-business`,'');if(stored)setBusinessName(stored)},[userEmail,base]);"
const newLoad = "useEffect(()=>{if(!userEmail){setStorageReady(false);return}setStorageReady(false);setProducts(load(`${base}-products`,[]));setSales(load(`${base}-sales`,[]));setClients(load(`${base}-clients`,[]));setOrders(load(`${base}-orders`,[]));setCash(load(`${base}-cash`,[]));setBusinessCategories(load(`${base}-categories`,['General','Productos','Servicios','Otros']));const stored=load(`${base}-business`,'');if(stored)setBusinessName(stored);setStorageReady(true)},[userEmail,base]);"
if (source.includes(oldLoad)) source = source.replace(oldLoad, newLoad)

const injected = [
"const key=userEmail.toLowerCase().trim(); const base=`casa-allegra-${key||'guest'}`;",
" // CASA ALLEGRA UNIVERSAL CLOUD SYNC: recuperación segura y sincronización de TODO el historial.",
" useEffect(()=>{if(!userEmail||!supabase)return;let cancelled=false;let timer;let syncing=false;const db=supabase;const prefix='casa-allegra-';",
"const snapshot=():Record<string,string>=>{const out:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(prefix)&&k!=='casa-allegra-cloud-last-snapshot'&&k!=='casa-allegra-zero-data-v1')out[k]=localStorage.getItem(k)||''}return out};",
"const migrate=()=>{const legacy=['products','sales','clients','orders','cash','categories','business'];for(const s of legacy){const old=prefix+s;const target=base+'-'+s;const v=localStorage.getItem(old);if(v!=null&&(!localStorage.getItem(target)||localStorage.getItem(target)==='[]'||localStorage.getItem(target)===''))try{localStorage.setItem(target,v)}catch{}}};",
"const empty=(v:string|undefined|null)=>v==null||v===''||v==='[]'||v==='{}'||v==='null';",
"const merge=(local:Record<string,string>,cloud:Record<string,string>):Record<string,string>=>{const out:Record<string,string>={...cloud,...local};for(const k of new Set([...Object.keys(cloud),...Object.keys(local)])){const l=local[k],c=cloud[k];if(empty(l)&&!empty(c)){out[k]=c;continue}if(empty(c)&&!empty(l)){out[k]=l;continue}if(l==null){out[k]=c||'';continue}if(c==null){out[k]=l;continue}try{const a=JSON.parse(l),b=JSON.parse(c);if(Array.isArray(a)&&Array.isArray(b)){const all=[...b,...a],seen=new Set<string>(),m:unknown[]=[];for(const item of all){const id=item&&typeof item==='object'?((item as {id?:unknown;number?:unknown;sku?:unknown}).id??(item as {number?:unknown}).number??(item as {sku?:unknown}).sku):null;const sig=id!=null?String(id):JSON.stringify(item);if(!seen.has(sig)){seen.add(sig);m.push(item)}}out[k]=JSON.stringify(m)}else out[k]=l||c}catch{out[k]=l||c}}return out};",
"const write=(d:Record<string,string>)=>{for(const [k,v] of Object.entries(d)){try{localStorage.setItem(k,v)}catch{}}};",
"const apply=(d:Record<string,string>)=>{write(d);setProducts(load(base+'-products',[]));setSales(load(base+'-sales',[]));setClients(load(base+'-clients',[]));setOrders(load(base+'-orders',[]));setCash(load(base+'-cash',[]));setBusinessCategories(load(base+'-categories',['General','Productos','Servicios','Otros']));const n=load(base+'-business','');if(n)setBusinessName(n);setStorageReady(true)};",
"const syncNow=async()=>{if(cancelled||syncing)return;syncing=true;try{migrate();const local=snapshot();const auth=await db.auth.getUser();const uid=auth.data.user?.id;if(!uid){setStorageReady(true);return}const result=await db.from('business_state').select('payload,updated_at').eq('user_id',uid).maybeSingle();if(result.error)throw result.error;const row=(result.data as unknown) as {payload?:unknown} | null;const rawStorage=row&&row.payload&&typeof row.payload==='object'&&row.payload!==null?((row.payload as {storage?:unknown}).storage):null;const cloud=rawStorage&&typeof rawStorage==='object'?rawStorage as Record<string,string>:{};const merged=merge(local,cloud);apply(merged);const payload={version:5,storage:snapshot()};const saved=await db.from('business_state').upsert({user_id:uid,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(saved.error)throw saved.error;sessionStorage.setItem('casa-allegra-cloud-last-snapshot',JSON.stringify(snapshot()))}catch(err){console.warn('CASA ALLEGRA: recuperación cloud no disponible.',err);setStorageReady(true)}finally{syncing=false}};",
"syncNow();timer=window.setInterval(()=>{if(document.visibilityState==='visible')syncNow()},2000);const refresh=()=>{if(document.visibilityState==='visible')syncNow()};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{cancelled=true;if(timer)window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[userEmail,base]);"
].join('\n')

source = source.replace(needle, injected)
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: recuperación y sincronización universal corregidas correctamente.')