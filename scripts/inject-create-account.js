const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const entry="<button className=\"mobile-create-account\" onClick={()=>openAuth('signup')} style={{display:'inline-flex',alignItems:'center',gap:6,border:0,borderRadius:12,padding:'9px 12px',background:'#6d28d9',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer'}}><Icon name=\"plus\" size={18}/><span>Crear cuenta</span></button>"
if(!source.includes('mobile-create-account')){
 const marker='</header>'
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA: no se encontró el cierre del encabezado.')
 source=source.slice(0,index)+entry+source.slice(index)
}
const beta="<div className=\"beta-site-badge\" aria-label=\"CASA ALLEGRA versión BETA\" style={{position:'fixed',top:10,left:'50%',transform:'translateX(-50%)',zIndex:10000,padding:'5px 9px',borderRadius:999,background:'#fff',border:'1px solid rgba(109,40,217,.25)',boxShadow:'0 3px 12px rgba(0,0,0,.12)',color:'#6d28d9',fontSize:10,fontWeight:900,letterSpacing:'.08em'}}>BETA · Sitio en prueba</div>"
if(!source.includes('BETA · Sitio en prueba')){
 const marker='</header>'
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA: no se encontró el cierre del encabezado para BETA.')
 source=source.slice(0,index)+beta+source.slice(index)
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Crear cuenta y BETA visibles en todos los tamaños de pantalla.')
