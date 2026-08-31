const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const importLine="import SettingsManager from '../components/SettingsManager'"
if(!source.includes(importLine)){
  source=source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n"+importLine)
}
const block="{section==='configuracion'&&<SettingsManager businessName={businessName} userEmail={userEmail} storageKey={base} onBusinessNameChange={setBusinessName} onEmailChange={setUserEmail} onNotice={setNotice}/> }"
const old=/\{section==='configuracion'&&<section className="panel large-section"><h2>Configuración<\/h2><p>Negocio: <b>\{businessName\|\|'CASA ALLEGRA'\}<\/b><\/p><p>Cuenta: <b>\{userEmail\}<\/b><\/p><\/section>\}/
if(old.test(source)){
  source=source.replace(old,block)
}else if(!source.includes("<SettingsManager businessName={businessName}")){
  const generic=source.indexOf("{section==='configuracion'&&")
  if(generic!==-1){
    const end=source.indexOf('</section>}',generic)
    if(end!==-1) source=source.slice(0,generic)+block+source.slice(end+'</section>}'.length)
  }
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Configuración completa integrada.')
