const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const entry="<button className=\"mobile-create-account\" onClick={()=>openAuth('signup')}><Icon name=\"plus\" size={18}/><span>Crear cuenta</span></button>"
if(!source.includes('mobile-create-account')){
 const marker='</header>'
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA: no se encontró el cierre del encabezado.')
 source=source.slice(0,index)+entry+source.slice(index)
}
if(!source.includes('BETA · Sitio en prueba')){
 const beta="<div className=\"beta-site-badge\" aria-label=\"CASA ALLEGRA versión BETA\">BETA · Sitio en prueba</div>"
 const marker='</header>'
 const index=source.indexOf(marker)
 if(index<0) throw new Error('CASA ALLEGRA: no se encontró el cierre del encabezado para BETA.')
 source=source.slice(0,index)+beta+source.slice(index)
}
const style="<style>{`.mobile-create-account{display:none;align-items:center;gap:6px;border:0;border-radius:12px;padding:9px 12px;background:#6d28d9;color:#fff;font-weight:800;font-size:13px;cursor:pointer}.beta-site-badge{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:10000;padding:5px 9px;border-radius:999px;background:#fff;border:1px solid rgba(109,40,217,.25);box-shadow:0 3px 12px rgba(0,0,0,.12);color:#6d28d9;font-size:10px;font-weight:900;letter-spacing:.08em}@media(max-width:700px){.mobile-create-account{display:inline-flex}.beta-site-badge{top:58px;font-size:9px}}`}</style>"
if(!source.includes('.mobile-create-account{display:none')){
 const marker="</body>"
 const index=source.indexOf(marker)
 if(index>=0) source=source.slice(0,index)+style+source.slice(index)
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Crear cuenta y BETA visibles también en iPhone.')
