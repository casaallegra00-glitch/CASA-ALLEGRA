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
if (source.includes(oldSection) && !source.includes("|'presupuestos'|")) source = source.replace(oldSection, newSection)

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

// El logo se mostraba en la vista previa HTML, pero no se estaba incrustando
// dentro del SVG usado para PNG/PDF. Resolver rutas relativas permite usar
// tanto imágenes subidas (data:) como el logo predeterminado del proyecto.
const svgStart = "const renderSvg=()=>{"
const logoMarker = "const logoSrc="
if (budgetSource.includes(svgStart) && !budgetSource.includes(logoMarker)) {
  budgetSource = budgetSource.replace(
    svgStart,
    `${svgStart}\n  const logoSrc=logo.startsWith('data:')?logo:(typeof window!=='undefined'?new URL(logo,window.location.origin).href:logo)`
  )
}
const svgNeedle = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"1414\" viewBox=\"0 0 1000 1414\"><rect width=\"1000\" height=\"1414\" fill=\"#fff\"/><rect x=\"40\" y=\"40\" width=\"920\" height=\"1334\" rx=\"24\" fill=\"#fff\" stroke=\"#d8cfff\" stroke-width=\"4\"/><text x=\"70\" y=\"105\""
const svgWithLogo = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"1414\" viewBox=\"0 0 1000 1414\"><rect width=\"1000\" height=\"1414\" fill=\"#fff\"/><rect x=\"40\" y=\"40\" width=\"920\" height=\"1334\" rx=\"24\" fill=\"#fff\" stroke=\"#d8cfff\" stroke-width=\"4\"/><image href=\"${esc(logoSrc)}\" x=\"70\" y=\"58\" width=\"120\" height=\"90\" preserveAspectRatio=\"xMidYMid meet\"/><text x=\"210\" y=\"105\""
if (budgetSource.includes(svgNeedle) && budgetSource.includes(logoMarker) && !budgetSource.includes('preserveAspectRatio="xMidYMid meet"')) {
  budgetSource = budgetSource.replace(svgNeedle, svgWithLogo)
}

fs.writeFileSync(file, source)
fs.writeFileSync(budgetFile, budgetSource)
console.log('CASA ALLEGRA: apartado de Presupuestos integrado y logo corregido para vista previa, PNG y PDF.')
