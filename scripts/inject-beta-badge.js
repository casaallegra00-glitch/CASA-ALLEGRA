const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const marker='<main'
const badge='<div className="beta-badge" aria-label="Versión BETA">BETA</div>'
if(source.includes('beta-badge')){console.log('CASA ALLEGRA: cartel BETA ya está presente.')}else{
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA BETA: no se encontró el inicio del contenido principal.')
 source=source.slice(0,index)+badge+source.slice(index)
 fs.writeFileSync(file,source)
 console.log('CASA ALLEGRA: cartel BETA agregado.')
}
