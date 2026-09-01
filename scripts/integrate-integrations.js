const fs=require('fs')
const path=require('path')

const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')

// No cargar el módulo funcional de integraciones por ahora.
source=source.replace("\nimport IntegrationManager from '../components/IntegrationManager'",'')

// Reemplazar cualquier bloque funcional de Integraciones por una pantalla informativa.
const marker="{section==='integraciones'&&"
const nextMarkers=["{section==='ia'&&","{section==='notificaciones'&&","{section==='configuracion'&&","{section==='ayuda'&&"]
const start=source.indexOf(marker)
if(start>=0){
  const ends=nextMarkers.map(m=>source.indexOf(m,start+marker.length)).filter(i=>i>=0)
  const end=ends.length?Math.min(...ends):source.indexOf('</main>',start)
  if(end>start){
    const replacement="{section==='integraciones'&&<section className='panel large-section' style={{minHeight:320,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center',maxWidth:620,padding:32}}><div style={{fontSize:56,marginBottom:12}}>🔗</div><span className='eyebrow'>PRÓXIMAMENTE</span><h2 style={{margin:'8px 0 10px'}}>Integraciones</h2><p style={{opacity:.75,fontSize:16,lineHeight:1.6,margin:0}}>Las integraciones con Mercado Pago, Mercado Libre, Mercado Envíos, Andreani y Correo Argentino estarán disponibles próximamente.</p><div style={{marginTop:18,display:'inline-flex',padding:'10px 14px',borderRadius:999,background:'#F5F1FF',fontWeight:900,fontSize:13}}>🚧 Función en desarrollo</div></div></section>}\n"
    source=source.slice(0,start)+replacement+source.slice(end)
  }
}

// Marcar Integraciones como Próximamente y bloquear su navegación.
source=source.replace("['integraciones','Integraciones','integrations']","['integraciones','Integraciones · Próximamente','integrations']")
const navPattern="{nav.map(([id,label,icon])=><button key={id} onClick={()=>goTo(id)} className={`nav-item ${section===id?'active':''}`}><Icon name={icon} size={19}/><span>{label}</span></button>)}"
const navReplacement="{nav.map(([id,label,icon])=><button key={id} type='button' disabled={id==='integraciones'} onClick={()=>id==='integraciones'?setNotice('Integraciones: próximamente.'):goTo(id)} className={`nav-item ${section===id?'active':''}`} style={id==='integraciones'?{opacity:.5,cursor:'not-allowed'}:undefined}><Icon name={icon} size={19}/><span>{label}</span></button>)}"
source=source.replace(navPattern,navReplacement)

// Evitar que intentos OAuth antiguos fuercen la apertura de Integraciones.
source=source.replace(/\s*useEffect\(\(\)=>\{const requested=new URLSearchParams\(window\.location\.search\)\.get\('section'\);if\(requested==='integraciones'\)setSection\('integraciones'\)\},\[\]\);/g,'')
source=source.replace(/\s*useEffect\(\(\)=>\{const requested=new URLSearchParams\(window\.location\.search\)\.get\('section'\);if\(requested==='integraciones'&&userEmail\)setSection\('integraciones'\)\},\[userEmail\]\);/g,'')

fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Integraciones desactivadas, visibles como Próximamente y bloqueadas.')
