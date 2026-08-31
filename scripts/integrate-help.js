const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')

const importLine="import HelpManager from '../components/HelpManager'"
if(!source.includes(importLine)){
  source=source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n"+importLine)
}

// Ensure the Section union contains both modules, regardless of the exact current ordering.
const sectionMatch=source.match(/type Section = 'inicio'[^\n]*/)
if(sectionMatch){
  let sectionLine=sectionMatch[0]
  if(!sectionLine.includes("'presupuestos'")) sectionLine=sectionLine.replace("'reportes'", "'presupuestos'|'reportes'")
  if(!sectionLine.includes("'ayuda'")) sectionLine=sectionLine.replace("'configuracion'", "'ayuda'|'configuracion'")
  source=source.replace(sectionMatch[0],sectionLine)
}

// Ensure AYUDA is present in the sidebar navigation.
const navEntry="['ayuda','Ayuda','help']"
if(!source.includes(navEntry)){
  const navMatch=source.match(/const nav:Array<[^\n]+\n?/)
  if(navMatch){
    const line=navMatch[0]
    const pos=line.lastIndexOf(']]')
    if(pos!==-1) source=source.slice(0,source.indexOf(line)+pos)+",[\'ayuda\',\'Ayuda\',\'help\']"+source.slice(source.indexOf(line)+pos)
  }
}

// Replace the old placeholder with the real HelpManager, or insert it before closing of the main content.
const helpBlock="{section==='ayuda'&&<HelpManager onGo={goTo} businessName={businessName||'CASA ALLEGRA APP'} storageKey={base}/> }"
const oldHelp=/\{section==='ayuda'&&<section className=\"panel large-section\"><h2>Ayuda<\/h2><p>Administrá productos, ventas, clientes, pedidos, caja y reportes\.<\/p><\/section>\}/
if(oldHelp.test(source)){
  source=source.replace(oldHelp,helpBlock)
}else if(!source.includes("<HelpManager onGo={goTo}")){
  const insertionNeedle="</main></div><footer"
  if(source.includes(insertionNeedle)) source=source.replace(insertionNeedle,helpBlock+"\n"+insertionNeedle)
}

// Add the Primeros pasos card to Inicio once, immediately after the welcome card.
if(!source.includes('🚀 Primeros pasos')){
  const welcomeEnd="</section>}\n {section==='productos'"
  const onboarding="</section>}\n <div className='panel' style={{marginTop:18}}><div className='panel-heading'><div><span className='eyebrow'>GUIA INICIAL</span><h2>🚀 Primeros pasos</h2><small>Configurá CASA ALLEGRA APP y empezá a trabajar.</small></div><button type='button' className='primary-btn' onClick={()=>goTo('ayuda')}>Ver guía completa</button></div><p style={{marginBottom:0}}>Configurá tu negocio → agregá productos → clientes → registrá tu primera venta → creá un presupuesto → conocé ANGI.</p></div>\n {section==='productos'"
  if(source.includes(welcomeEnd)) source=source.replace(welcomeEnd,onboarding)
}

fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Ayuda y Primeros pasos integrados de forma robusta.')
