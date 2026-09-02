const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

if (source.includes('CASA ALLEGRA CLOUD SYNC')) {
  console.log('CASA ALLEGRA: sincronización en la nube ya integrada.')
  process.exit(0)
}

// Integramos sobre el código real generado por los demás scripts. Los patrones son deliberadamente tolerantes.
const statePattern = /const\s*\[cash\s*,\s*setCash\]\s*=\s*useState<CashMove\[\]>\(\[\]\);/
if (!statePattern.test(source)) {
  console.warn('CASA ALLEGRA: no se encontró el estado principal; se omite cloud sync para no romper el build.')
  process.exit(0)
}
source = source.replace(statePattern, 'const [cash,setCash]=useState<CashMove[]>([]); const [cloudReady,setCloudReady]=useState(false);')

// Reemplaza exactamente el efecto que carga los datos locales al cambiar de usuario.
const loadPattern = /useEffect\(\(\)=>\{if\(!userEmail\)return;[\s\S]*?\},\[userEmail,base\]\);/

const cloudLoad = `// CASA ALLEGRA CLOUD SYNC: la nube es la fuente principal y localStorage queda como respaldo.
 useEffect(()=>{let cancelled=false;const sync=async()=>{if(!userEmail){setCloudReady(false);return}setCloudReady(false);const localProducts=load(\`\${base}-products\`,[]);const localSales=load(\`\${base}-sales\`,[]);const localClients=load(\`\${base}-clients\`,[]);const localOrders=load(\`\${base}-orders\`,[]);const localCash=load(\`\${base}-cash\`,[]);const localCategories=load(\`\${base}-categories\`,['General','Productos','Servicios','Otros']);const localBusiness=load(\`\${base}-business\`,'');if(localProducts.length)setProducts(localProducts);if(localSales.length)setSales(localSales);if(localClients.length)setClients(localClients);if(localOrders.length)setOrders(localOrders);if(localCash.length)setCash(localCash);setBusinessCategories(localCategories);if(localBusiness)setBusinessName(localBusiness);if(!supabase){if(!cancelled)setCloudReady(true);return}try{const {data:userData}=await supabase.auth.getUser();const uid=userData.user?.id;if(!uid){if(!cancelled)setCloudReady(true);return}const {data,error}=await supabase.from('business_state').select('payload,updated_at').eq('user_id',uid).maybeSingle();if(error)throw error;if(data?.payload){const p=data.payload;if(!cancelled){setProducts(Array.isArray(p.products)?p.products:[]);setSales(Array.isArray(p.sales)?p.sales:[]);setClients(Array.isArray(p.clients)?p.clients:[]);setOrders(Array.isArray(p.orders)?p.orders:[]);setCash(Array.isArray(p.cash)?p.cash:[]);setBusinessCategories(Array.isArray(p.businessCategories)?p.businessCategories:localCategories);if(typeof p.businessName==='string')setBusinessName(p.businessName)}}else{const payload={products:localProducts,sales:localSales,clients:localClients,orders:localOrders,cash:localCash,businessCategories:localCategories,businessName:localBusiness||''};const {error:upsertError}=await supabase.from('business_state').upsert({user_id:uid,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(upsertError)throw upsertError}}catch(err){console.warn('CASA ALLEGRA: no se pudo sincronizar con la nube; se mantiene el respaldo local.',err)}finally{if(!cancelled)setCloudReady(true)}};sync();return()=>{cancelled=true}},[userEmail,base]);`

if (!loadPattern.test(source)) {
  console.warn('CASA ALLEGRA: no se encontró el cargador local; se omite cloud sync para no romper el build.')
  process.exit(0)
}
source = source.replace(loadPattern, cloudLoad)

// Reemplaza todos los efectos de guardado local por los mismos respaldos + guardado cloud.
const savesPattern = /useEffect\(\(\)=>save\([\s\S]*?\[base,businessName\]\);/

const cloudSaves = `useEffect(()=>save(\`\${base}-products\`,products),[base,products]); useEffect(()=>save(\`\${base}-sales\`,sales),[base,sales]); useEffect(()=>save(\`\${base}-clients\`,clients),[base,clients]); useEffect(()=>save(\`\${base}-orders\`,orders),[base,orders]); useEffect(()=>save(\`\${base}-cash\`,cash),[base,cash]); useEffect(()=>save(\`\${base}-categories\`,businessCategories),[base,businessCategories]); useEffect(()=>{if(businessName)save(\`\${base}-business\`,businessName)},[base,businessName]);
 // CASA ALLEGRA CLOUD SYNC: cada cambio se guarda en la cuenta, no en el dispositivo.
 useEffect(()=>{if(!cloudReady||!supabase||!userEmail)return;let cancelled=false;const timer=window.setTimeout(async()=>{try{const {data:userData}=await supabase.auth.getUser();const uid=userData.user?.id;if(!uid||cancelled)return;const payload={products,sales,clients,orders,cash,businessCategories,businessName};const {error}=await supabase.from('business_state').upsert({user_id:uid,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error}catch(err){console.warn('CASA ALLEGRA: error guardando sincronización.',err)}},350);return()=>{cancelled=true;window.clearTimeout(timer)}},[cloudReady,userEmail,products,sales,clients,orders,cash,businessCategories,businessName]);
 // Al volver a abrir/enfocar la app, vuelve a leer la nube para reflejar cambios hechos en otro dispositivo.
 useEffect(()=>{if(!cloudReady||!supabase||!userEmail)return;const refresh=async()=>{try{const {data:userData}=await supabase.auth.getUser();const uid=userData.user?.id;if(!uid)return;const {data}=await supabase.from('business_state').select('payload').eq('user_id',uid).maybeSingle();const p=data?.payload;if(!p)return;setProducts(Array.isArray(p.products)?p.products:[]);setSales(Array.isArray(p.sales)?p.sales:[]);setClients(Array.isArray(p.clients)?p.clients:[]);setOrders(Array.isArray(p.orders)?p.orders:[]);setCash(Array.isArray(p.cash)?p.cash:[]);setBusinessCategories(Array.isArray(p.businessCategories)?p.businessCategories:['General','Productos','Servicios','Otros']);if(typeof p.businessName==='string')setBusinessName(p.businessName)}catch(err){console.warn('CASA ALLEGRA: error actualizando desde la nube.',err)}};const onVisible=()=>{if(document.visibilityState==='visible')refresh()};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',onVisible);return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',onVisible)}},[cloudReady,userEmail]);`

if (!savesPattern.test(source)) {
  console.warn('CASA ALLEGRA: no se encontraron los guardados locales; se omite cloud sync para no romper el build.')
  process.exit(0)
}
source = source.replace(savesPattern, cloudSaves)

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: sincronización en la nube integrada correctamente.')
