const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')
const badge = `<div style={{position:'fixed',top:12,right:12,zIndex:9999,display:'inline-flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:999,border:'1px solid rgba(109,40,217,.25)',background:'rgba(255,255,255,.94)',boxShadow:'0 4px 14px rgba(0,0,0,.10)',fontSize:12,fontWeight:800,letterSpacing:'.08em',color:'#6d28d9'}}>BETA</div>`
if (!source.includes('CASA_ALLEGRA_BETA_BADGE')) {
  const marker = "export default function Home(){"
  if (!source.includes(marker)) throw new Error('CASA ALLEGRA BETA: no se encontró Home.')
  source = source.replace(marker, `${marker}\n const CASA_ALLEGRA_BETA_BADGE = true;`)
  const mainMarker = '<main'
  const mainIndex = source.indexOf(mainMarker)
  if (mainIndex < 0) throw new Error('CASA ALLEGRA BETA: no se encontró el contenedor principal.')
  source = source.slice(0, mainIndex) + `{CASA_ALLEGRA_BETA_BADGE && ${badge}}` + source.slice(mainIndex)
}
fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: cartel BETA agregado.')
