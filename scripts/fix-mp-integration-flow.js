const fs=require('fs')
const path=require('path')

function patch(file, replacements, message){
 if(!fs.existsSync(file)) return
 let source=fs.readFileSync(file,'utf8')
 let changed=false
 for(const [from,to] of replacements){
  if(source.includes(from) && !source.includes(to)){ source=source.replace(from,to); changed=true }
 }
 if(changed){fs.writeFileSync(file,source);console.log(`CASA ALLEGRA: ${message}.`)}
}

const root=process.cwd()
const page=path.join(root,'app','page.tsx')
patch(page,[[
 "useEffect(()=>{if(!userEmail&&section!=='inicio')setSection('inicio')},[userEmail,section]);",
 "useEffect(()=>{if(!userEmail&&section!=='inicio')setSection('inicio')},[userEmail,section]); useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('section');if(requested==='integraciones'&&userEmail)setSection('integraciones')},[userEmail]);"
]],'enlace directo a Integraciones restaurado después de OAuth')

const manager=path.join(root,'components','IntegrationManager.tsx')
patch(manager,[[
 "if(key==='mercadopago'&&!connected.mercadopago){window.location.href=mpConfigured?'/api/integrations/mercadopago/connect':'/';return}",
 "if(key==='mercadopago'&&!connected.mercadopago){if(!mpConfigured){onNotice('Mercado Pago todavía no está configurado. Revisá MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI y MP_TOKEN_ENCRYPTION_KEY en Vercel.');return}window.location.href='/api/integrations/mercadopago/connect';return}"
],[
 "<button type='button' className='secondary-btn' onClick={loadRemote.bind(null,'mercadopago')} disabled={!mpConfigured}>Conectar Mercado Pago</button>",
 "<button type='button' className='secondary-btn' onClick={()=>void loadRemote('mercadopago')}>Conectar Mercado Pago</button>"
]],'flujo de conexión de Mercado Pago corregido')

const callback=path.join(root,'app','api','integrations','mercadopago','callback','route.ts')
patch(callback,[[
 "const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('integration','mercadopago')",
 "const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('section','integraciones');back.searchParams.set('integration','mercadopago')"
]],'retorno OAuth de Mercado Pago conectado con la sección Integraciones')
