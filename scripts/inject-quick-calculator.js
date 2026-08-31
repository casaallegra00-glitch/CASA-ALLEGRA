const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','costos','page.tsx')
let source=fs.readFileSync(file,'utf8')
const importLine="import QuickCalculator from '../../components/QuickCalculator'"
if(!source.includes(importLine)){
  const marker="import {useEffect,useMemo,useState} from 'react'"
  if(!source.includes(marker)) throw new Error('No se encontró la cabecera de la calculadora de costos.')
  source=source.replace(marker,marker+"\n"+importLine)
}
if(!source.includes('<QuickCalculator/>')){
  const marker="export default function Costos(){"
  const start=source.indexOf(marker)
  if(start===-1) throw new Error('No se encontró el componente Costos.')
  const bodyStart=source.indexOf('\n',start)
  source=source.slice(0,bodyStart+1)+" return <main style={{minHeight:'100vh',background:'#f8fbfd',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif',padding:28,color:'#293640'}}><div style={{maxWidth:1100,margin:'auto'}}><QuickCalculator/>"+source.slice(bodyStart+1)
  const firstReturnEnd="<header style={{marginBottom:22}}><div style={{fontWeight:900,fontSize:24,letterSpacing:'.04em',color:'#30414e'}}>CASAALLEGRA <span style={{color:'#63bfc2'}}>APP</span></div>"
  if(!source.includes(firstReturnEnd)) throw new Error('No se pudo localizar el encabezado existente para completar la inyección.')
  source=source.replace(firstReturnEnd,firstReturnEnd)
  // The original return now has a duplicated outer <main>; normalize by removing its first wrapper/opening div.
  const original=" return <main style={{minHeight:'100vh',background:'#f8fbfd',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif',padding:28,color:'#293640'}}><div style={{maxWidth:1100,margin:'auto'}}><header"
  source=source.replace(original,"<header")
  source=source.replace(/<\\/div><\\/main>\\s*}\\s*$/,'</div></main>}')
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: calculadora rápida integrada con comportamiento de porcentajes estilo iPhone.')
