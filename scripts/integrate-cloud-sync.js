const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')

source=source.replace(/\s*\/\/ CASA ALLEGRA CLOUD SYNC V3 START[\s\S]*?\/\/ CASA ALLEGRA CLOUD SYNC V3 END\s*/g,'\n')

source=source.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react['"]/,(_,items)=>{
  const names=items.split(',').map((x)=>x.trim()).filter(Boolean)
  if(!names.includes('useRef'))names.push('useRef')
  return `import { ${names.join(', ')} } from 'react'`
})

const baseRegex=/const\s+key\s*=\s*userEmail\.toLowerCase\(\)\.trim\(\)\s*;\s*const\s+base\s*=\s*`casa-allegra-\$\{key\|\|'guest'\}`\s*;/
const baseMatch=source.match(baseRegex)
if(!baseMatch)throw new Error('CASA ALLEGRA cloud sync: no se encontró la base de almacenamiento.')
const baseMarker=baseMatch[0]

if(!/readyBaseRef\s*=\s*useRef/.test(source)){
  source=source.replace(baseMarker,`const readyBaseRef=useRef(false); const lastCloudUpdatedRef=useRef(''); const lastPushedHashRef=useRef('');\n ${baseMarker}`)
}

const guardedSave=/useEffect\(\(\)=>save\((`\$\{base\}-(?:products|sales|clients|orders|cash|categories|business)`),([^;]+)\),\[base,([^\]]+)\]\);/g
source=source.replace(guardedSave,(_,keyExpr,valueExpr,deps)=>`useEffect(()=>{if(!userEmail||!readyBaseRef.current)return;save(${keyExpr},${valueExpr})},[base,userEmail,${deps}]);`)

const syncBlock=`
// CASA ALLEGRA CLOUD SYNC V3 START
const cloudDb:any=supabase
const emptyValue=(v:string|undefined|null)=>{if(v==null||v==='')return true;try{const x=JSON.parse(v);return x===null||(Array.isArray(x)&&x.length===0)||(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===0)}catch{return false}}
const snapshotFromLocal=()=>{const out:Record<string,string>={};if(typeof window==='undefined')return out;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(base+'-')&&!k.includes('-cloud-sync-')){const v=localStorage.getItem(k);if(v!==null)out[k]=v}}return out}
const stableSnapshot=(v:Record<string,string>)=>JSON.stringify(Object.keys(v).sort().reduce((o,k)=>{o[k]=v[k];return o},{} as Record<string,string>))
const mergeArrays=(a:any[],b:any[])=>{const out=[...a];const keyOf=(x:any)=>x&&typeof x==='object'?String(x.id??x.number??x.sku??x.code??x.signature??JSON.stringify(x)):JSON.stringify(x);for(const item of b){const key=keyOf(item);if(!out.some(x=>keyOf(x)===key))out.push(item)}return out}
const mergeSnapshots=(local:Record<string,string>,cloud:Record<string,string>,preferCloud:boolean)=>{const out:Record<string,string>={};const keys=new Set([...Object.keys(local),...Object.keys(cloud)]);for(const k of keys){const lv=local[k],cv=cloud[k];if(emptyValue(lv)&&!emptyValue(cv)){out[k]=cv;continue}if(emptyValue(cv)){out[k]=lv;continue}try{const l=JSON.parse(lv),c=JSON.parse(cv);if(Array.isArray(l)&&Array.isArray(c)){out[k]=JSON.stringify(mergeArrays(l,c));continue}}catch{}out[k]=preferCloud?cv:lv}return out}
const applySnapshotToState=(storage:Record<string,string>)=>{const read=(suffix:string,fallback:any)=>{const raw=storage[base+'-'+suffix];if(raw===undefined)return fallback;try{return JSON.parse(raw)}catch{return fallback}};setProducts(read('products',[]));setSales(read('sales',[]));setClients(read('clients',[]));setOrders(read('orders',[]));setCash(read('cash',[]));setBusinessCategories(read('categories',['General','Productos','Servicios','Otros']));const business=storage[base+'-business'];if(business!==undefined){try{setBusinessName(JSON.parse(business)||'')}catch{}}}
const pushSnapshot=async(uid:string,storage:Record<string,string>)=>{if(!cloudDb||!uid)return false;try{const r=await cloudDb.from('business_state').upsert({user_id:uid,payload:{version:3,storage},updated_at:new Date().toISOString()},{onConflict:'user_id'});return !r?.error}catch{return false}}
useEffect(()=>{let cancelled=false;let timer:any=null;const sync=async()=>{if(cancelled||!userEmail||!cloudDb)return;const session=await cloudDb.auth.getSession().catch(()=>null);const uid=session?.data?.session?.user?.id;if(!uid)return;const local=snapshotFromLocal();let remote:Record<string,string>={};let remoteUpdated='';try{const r=await cloudDb.from('business_state').select('payload,updated_at').eq('user_id',uid).maybeSingle();if(!r?.error&&r?.data?.payload?.storage&&typeof r.data.payload.storage==='object'){remote=r.data.payload.storage;remoteUpdated=String(r.data.updated_at||'')}}catch{}if(cancelled)return;const localHash=stableSnapshot(local);if(!lastCloudUpdatedRef.current){if(Object.keys(remote).length){const merged=mergeSnapshots(local,remote,true);for(const [k,v] of Object.entries(merged))if(!emptyValue(v))localStorage.setItem(k,v);applySnapshotToState(merged);lastPushedHashRef.current=stableSnapshot(merged);lastCloudUpdatedRef.current=remoteUpdated||new Date().toISOString()}else{if(Object.keys(local).length){await pushSnapshot(uid,local);lastPushedHashRef.current=localHash}lastCloudUpdatedRef.current=new Date().toISOString()}readyBaseRef.current=true;return}if(remoteUpdated&&remoteUpdated>lastCloudUpdatedRef.current&&Object.keys(remote).length){const merged=mergeSnapshots(local,remote,true);for(const [k,v] of Object.entries(merged))if(!emptyValue(v))localStorage.setItem(k,v);applySnapshotToState(merged);lastCloudUpdatedRef.current=remoteUpdated;lastPushedHashRef.current=stableSnapshot(merged);return}if(localHash!==lastPushedHashRef.current){const merged=mergeSnapshots(local,remote,false);for(const [k,v] of Object.entries(merged))if(!emptyValue(v))localStorage.setItem(k,v);applySnapshotToState(merged);const mergedHash=stableSnapshot(merged);await pushSnapshot(uid,merged);lastPushedHashRef.current=mergedHash;lastCloudUpdatedRef.current=new Date().toISOString()}readyBaseRef.current=true};sync();timer=setInterval(sync,5000);const wake=()=>sync();window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake)}},[userEmail,base]);
// CASA ALLEGRA CLOUD SYNC V3 END
`

source=source.replace(baseMarker,baseMarker+syncBlock)
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: sincronizador cloud V3 corregido y preparado para el build.')
