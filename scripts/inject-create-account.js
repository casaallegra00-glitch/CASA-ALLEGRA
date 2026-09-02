const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const marker='</aside>'
const entry="{!userEmail&&<button className=\"nav-item create-account-nav\" onClick={()=>openAuth('signup')}><Icon name=\"plus\" size={19}/><span>Crear cuenta</span></button>}"
if(source.includes('create-account-nav')){console.log('CASA ALLEGRA: apartado Crear cuenta ya está presente.')}else{
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA: no se encontró el cierre del menú lateral.')
 source=source.slice(0,index)+entry+source.slice(index)
 fs.writeFileSync(file,source)
 console.log('CASA ALLEGRA: apartado Crear cuenta agregado al menú lateral.')
}
