const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

source = source.replace(
  '<input type="file" accept="image/*" onChange={handleLogoUpload} aria-label="Subir logo del negocio"/>',
  '<input type="file" accept="image/*" onChange={handleLogoUpload} aria-label="Subir logo del negocio" style={{display:"none"}}/>'
)

source = source.replace(
  '<input type="file" accept="image/*" onChange={handleLogoUpload}/><Icon name="plus"/>Cambiar logo',
  '<input type="file" accept="image/*" onChange={handleLogoUpload} style={{display:"none"}}/><Icon name="plus"/>Cambiar logo'
)

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: controles de carga de logo ocultos y listos.')
