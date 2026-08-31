const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')
const importLine="import SupplierManager from '../components/SupplierManager'"
if(!source.includes(importLine))source=source.replace("import { createClient } from '@supabase/supabase-js'","import { createClient } from '@supabase/supabase-js'\n"+importLine)
const sectionLine=source.match(/type Section = 'inicio'[^\n]*/)?.[0]
if(sectionLine&&!sectionLine.includes("'proveedores'"))source=source.replace(sectionLine,sectionLine.replace("'configuracion'","'proveedores'|'configuracion'"))
const navEntry="['proveedores','Proveedores','clients']"
if(!source.includes(navEntry)){
 const navMatch=source.match(/const nav:Array<[^\n]+/)
 if(!navMatch)throw new Error('No se encontró el menú lateral.')
 const line=navMatch[0]
 const updated=line.replace("['clientes','Clientes','clients']","['clientes','Clientes','clients'],['proveedores','Proveedores','clients']")
 if(updated===line)throw new Error('No se encontró Clientes en el menú lateral.')
 source=source.replace(line,updated)
}
const marker="{section==='caja'&&"
const block="{section==='proveedores'&&<SupplierManager products={products} onProductsChange={setProducts} storageKey={`${base}-proveedores`} onNotice={setNotice}/> }\n"
if(!source.includes('<SupplierManager products={products}')){
 const start=source.indexOf(marker)
 if(start===-1)throw new Error('No se encontró el punto de inserción antes de Caja.')
 source=source.slice(0,start)+block+source.slice(start)
}
fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: módulo de Proveedores integrado.')
