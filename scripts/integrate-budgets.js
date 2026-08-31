const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
const budgetFile = path.join(process.cwd(), 'components', 'BudgetManager.tsx')
let source = fs.readFileSync(file, 'utf8')
let budgetSource = fs.readFileSync(budgetFile, 'utf8')

const importLine = "import BudgetManager from '../components/BudgetManager'"
if (!source.includes(importLine)) {
  source = source.replace("import { createClient } from '@supabase/supabase-js'", "import { createClient } from '@supabase/supabase-js'\n" + importLine)
}

const oldSection = "type Section = 'inicio'|'ventas'|'productos'|'clientes'|'caja'|'pedidos'|'reportes'|'integraciones'|'notificaciones'|'ia'|'ayuda'|'configuracion'"
const newSection = "type Section = 'inicio'|'ventas'|'productos'|'clientes'|'pedidos'|'presupuestos'|'caja'|'reportes'|'integraciones'|'notificaciones'|'ia'|'ayuda'|'configuracion'"
if (source.includes(oldSection) && !source.includes("'presupuestos'")) source = source.replace(oldSection, newSection)

const navNeedle = "['pedidos','Pedidos','orders'],['caja','Caja','cash']"
const navWithBudget = "['pedidos','Pedidos','orders'],['presupuestos','Presupuestos','orders'],['caja','Caja','cash']"
if (!source.includes("['presupuestos','Presupuestos'")) {
  if (!source.includes(navNeedle)) throw new Error('No se encontró el menú lateral para insertar Presupuestos.')
  source = source.replace(navNeedle, navWithBudget)
}

const marker = "{section==='caja'&&"
const budgetBlock = "{section==='presupuestos'&&<BudgetManager products={products} clients={clients} businessName={businessName||'CASA ALLEGRA APP'} storageKey={`${base}-presupuestos`} onNotice={setNotice}/> }\n"
if (!source.includes("<BudgetManager products={products}")) {
  const start = source.indexOf(marker)
  if (start === -1) throw new Error('No se encontró el punto de inserción antes de Caja.')
  source = source.slice(0, start) + budgetBlock + source.slice(start)
}

// BudgetManager ya contiene la implementación correcta para incrustar el logo
// como data URL en PNG, SVG y PDF. No modificar ese componente durante el build.
if (!budgetSource.includes('const logoToDataUrl=')) {
  console.warn('CASA ALLEGRA: BudgetManager no tiene la implementación esperada de logo.')
}

fs.writeFileSync(file, source)
fs.writeFileSync(budgetFile, budgetSource)
console.log('CASA ALLEGRA: Presupuestos integrado sin reescribir la exportación del logo.')
