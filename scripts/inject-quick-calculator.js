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
  const headerMarker="<header style={{marginBottom:22}}>"
  if(!source.includes(headerMarker)) throw new Error('No se encontró el encabezado de la calculadora de costos.')
  source=source.replace(headerMarker,"<QuickCalculator/>\n"+headerMarker)
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: calculadora rápida integrada con comportamiento de porcentajes estilo iPhone.')
