const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const marker = 'data-costos-nav'
if (!source.includes(marker)) {
  const asideClose = '</aside>'
  if (!source.includes(asideClose)) {
    console.log('CASA ALLEGRA: menú lateral no encontrado; no se inserta la calculadora para evitar romper el build.')
    process.exit(0)
  }

  const button = '<button data-costos-nav className="side-costos" onClick={()=>{window.location.href="/costos"}}>🧮 Calculadora de costos</button>'
  source = source.replace(asideClose, `${button}${asideClose}`)
  fs.writeFileSync(file, source)
  console.log('CASA ALLEGRA: Calculadora de costos agregada al menú lateral.')
} else {
  console.log('CASA ALLEGRA: Calculadora de costos ya está en el menú lateral.')
}
