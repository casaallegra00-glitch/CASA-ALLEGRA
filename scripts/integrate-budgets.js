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

// Insertar el logo de forma que siempre quede dentro del documento exportado.
// Para una imagen subida (data:) ya tenemos el contenido. Para una ruta /...
// convertimos la URL del origen a datos antes de construir el SVG.
if (!budgetSource.includes("const logoForExport")) {
  const renderMarker = "const renderSvg=()=>{\n"
  const helper = `const logoForExport=async()=>{\n  if(!logo)return '';\n  if(logo.startsWith('data:'))return logo;\n  try{\n    const res=await fetch(logo);\n    const blob=await res.blob();\n    return await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(blob)})\n  }catch{return ''}\n}\n`
  budgetSource = budgetSource.replace(renderMarker, `${renderMarker.replace(/\n$/, '')}\n  const logoSrc=logo.startsWith('data:')?logo:(typeof window!=='undefined'?new URL(logo,window.location.origin).href:logo)\n`)
  // Reemplazamos exportaciones por una versión que incrusta la imagen como data URL.
  budgetSource = budgetSource.replace("const downloadImage=()=>", "const downloadImage=async()=>")
  budgetSource = budgetSource.replace("const downloadPdf=()=>", "const downloadPdf=async()=>")
  const oldRender = "const renderSvg=()=>{"
  if (budgetSource.includes(oldRender) && !budgetSource.includes("const buildSvgWithLogo")) {
    budgetSource = budgetSource.replace(oldRender, "const buildSvgWithLogo=async()=>{const embedded=await logoForExport();const previous=logo;setLogo(embedded||previous);await new Promise(r=>setTimeout(r,0));const svg=renderSvg();setLogo(previous);return svg}\n\n  const renderSvg=()=>{")
  }
  budgetSource = budgetSource.replace("const downloadImage=async()=>{if(!items.length", "const downloadImage=async()=>{if(!items.length")
  budgetSource = budgetSource.replace("const img=new Image();img.onload=", "const img=new Image();img.onload=")
  budgetSource = budgetSource.replace("img.src=renderSvg()", "buildSvgWithLogo().then(svg=>{img.src=svg})")
  budgetSource = budgetSource.replace("const svg=renderSvg();const w=window.open", "const svg=await buildSvgWithLogo();const w=window.open")
  budgetSource = budgetSource.replace("<img src={logo} alt=\"Logo\"", "<img src={logo} alt=\"Logo\"")
}

// Asegurar que el logo esté explícitamente dentro del SVG antes del nombre del negocio.
if (budgetSource.includes("const logoSrc=") && !budgetSource.includes('<image href=\"${esc(logoSrc)}\"')) {
  const rectNeedle = "<rect x=\\\"40\\\" y=\\\"40\\\" width=\\\"920\\\" height=\\\"1334\\\" rx=\\\"24\\\" fill=\\\"#fff\\\" stroke=\\\"#d8cfff\\\" stroke-width=\\\"4\\\"/>"
  const idx = budgetSource.indexOf(rectNeedle)
  if (idx !== -1) {
    const insertion = "<image href=\\\"${esc(logoSrc)}\\\" x=\\\"70\\\" y=\\\"58\\\" width=\\\"120\\\" height=\\\"90\\\" preserveAspectRatio=\\\"xMidYMid meet\\\"/>"
    budgetSource = budgetSource.slice(0, idx + rectNeedle.length) + insertion + budgetSource.slice(idx + rectNeedle.length)
  }
}

fs.writeFileSync(file, source)
fs.writeFileSync(budgetFile, budgetSource)
console.log('CASA ALLEGRA: Presupuestos integrado con logo incrustado en exportación.')
