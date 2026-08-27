const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const marker = 'data-costos-nav'
if (!source.includes(marker)) {
  const navPattern = /(<div className="side-title">Mi negocio<\/div>\{nav\.map\(\(\[id,label\]\)=><button key=\{id\} className=\{section===id\?'side-active':''\} onClick=\{\(\)=>setSection\(id\)\}>\{label\}<\/button>\)\})/
  const match = source.match(navPattern)
  if (!match) {
    console.error('No se encontró el menú lateral de CASA ALLEGRA para insertar la calculadora.')
    process.exit(1)
  }

  const button = '<button data-costos-nav className="side-costos" onClick={()=>{window.location.href="/costos"}}>🧮 Calculadora de costos</button>'
  source = source.replace(navPattern, `$1${button}`)
  fs.writeFileSync(file, source)
  console.log('CASA ALLEGRA: Calculadora de costos agregada al menú lateral.')
} else {
  console.log('CASA ALLEGRA: Calculadora de costos ya está en el menú lateral.')
}
