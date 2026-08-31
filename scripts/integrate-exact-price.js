const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','costos','page.tsx')
let source=fs.readFileSync(file,'utf8')
if(source.includes('Precio exacto')){
 console.log('CASA ALLEGRA: Precio exacto ya está integrado.')
 process.exit(0)
}
const needle="<Section id=\"result\" title=\"Resultado\" icon=\"chart\" openId={openId} setOpenId={setOpenId}>"
const insert="<div style={{...card,marginBottom:14,border:'2px solid #cfe9e8'}}><small style={{display:'block',color:'#60747b',fontWeight:800,marginBottom:5}}>PRECIO EXACTO</small><strong style={{display:'block',fontSize:34,color:'#2f7f83'}}>{money(saleNeeded)}</strong><small style={{display:'block',marginTop:4,color:'#71808b'}}>Valor exacto calculado antes de aplicar redondeo.</small></div>"
if(!source.includes(needle)) throw new Error('No se encontró la sección Resultado para insertar Precio exacto.')
source=source.replace(needle,needle+insert)
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Precio exacto agregado al resultado de la calculadora.')
