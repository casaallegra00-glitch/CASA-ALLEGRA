'use client'

import { useMemo, useState } from 'react'

type SectionId = 'inicio'|'productos'|'clientes'|'ventas'|'pedidos'|'presupuestos'|'caja'|'reportes'|'ia'|'notificaciones'|'integraciones'|'configuracion'

type Props = { onGo:(section:SectionId)=>void; businessName?:string; storageKey:string; completedExternal?:Partial<Record<string,boolean>> }

type Guide = { id:string; title:string; icon:string; text:string; section:SectionId; steps:string[] }

const guides:Guide[]=[
 {id:'inicio',title:'Inicio y configuración',icon:'🏠',text:'Configurá tu negocio y conocé el panel principal.',section:'inicio',steps:['Revisá el nombre de tu negocio en Configuración.','Definí cómo querés trabajar y mantené tus datos actualizados.','Usá Inicio como acceso rápido a las funciones principales.']},
 {id:'productos',title:'Productos',icon:'📦',text:'Creá productos, categorías, marcas, precios, stock e imágenes.',section:'productos',steps:['Creá las categorías que necesites.','Cargá nombre, marca, SKU, costo, precio y stock.','Usá Editar para cambiar precio, foto, marca, stock o categoría.']},
 {id:'clientes',title:'Clientes',icon:'👥',text:'Guardá los datos de tus clientes para reutilizarlos en ventas y presupuestos.',section:'clientes',steps:['Creá un cliente con sus datos.','Completá WhatsApp, email, dirección, DNI y CUIL cuando corresponda.','Usá el cliente en Ventas y Presupuestos.']},
 {id:'ventas',title:'Ventas',icon:'🛒',text:'Registrá ventas y asociá cada operación a un cliente.',section:'ventas',steps:['Elegí el cliente o creá uno nuevo.','Elegí producto, cantidad y medio de pago.','Registrá la venta y revisá stock e historial.']},
 {id:'pedidos',title:'Pedidos',icon:'📝',text:'Organizá pedidos y seguí claramente su estado.',section:'pedidos',steps:['Creá el pedido con cliente, detalle, importe y fecha.','Actualizá el estado según avance: pendiente, en proceso, listo, entregado o cancelado.','Usá las alertas de vencimiento para no olvidar entregas.']},
 {id:'presupuestos',title:'Presupuestos',icon:'📄',text:'Armá presupuestos comerciales listos para enviar a tus clientes.',section:'presupuestos',steps:['Elegí cliente y agregá productos.','Aplicá descuento y definí medio de pago y vigencia.','Agregá tu logo y exportá a PDF o imagen.']},
 {id:'caja',title:'Caja',icon:'💰',text:'Controlá ingresos, egresos y saldo.',section:'caja',steps:['Registrá cada ingreso o egreso.','Revisá el saldo acumulado.','Usá Caja junto con Ventas para mantener el control.']},
 {id:'reportes',title:'Reportes',icon:'📊',text:'Consultá ventas, caja, productos y pedidos en un solo lugar.',section:'reportes',steps:['Abrí Reportes para ver los indicadores.','Usá los gráficos para identificar tendencias.','Compará los resultados de tu negocio periódicamente.']},
 {id:'ia',title:'ANGI',icon:'✨',text:'ANGI es el asistente virtual de CASA ALLEGRA APP.',section:'ia',steps:['Entrá en ANGI desde el menú.','Elegí una pregunta rápida o escribí la tuya.','Consultá ventas, stock, clientes, pedidos, caja y reportes.']},
 {id:'notificaciones',title:'Notificaciones',icon:'🔔',text:'Recibí avisos importantes sobre tu negocio.',section:'notificaciones',steps:['Revisá alertas de stock bajo o negativo.','Controlá pedidos pendientes y vencidos.','Marcá las notificaciones como leídas cuando las revises.']},
 {id:'integraciones',title:'Integraciones',icon:'🔗',text:'Conocé las integraciones disponibles para el negocio.',section:'integraciones',steps:['Revisá las plataformas disponibles.','Configurá las conexiones que necesites.','Mantené las credenciales en forma segura.']},
]

export default function HelpManager({onGo,businessName='CASA ALLEGRA APP',storageKey,completedExternal={}}:Props){
 const [query,setQuery]=useState('')
 const [open,setOpen]=useState('')
 const [done,setDone]=useState<Record<string,boolean>>(completedExternal)
 const firstSteps=[
  {id:'business',title:'Configurá tu negocio',desc:'Revisá el nombre y la configuración principal.',section:'configuracion' as SectionId},
  {id:'product',title:'Agregá tu primer producto',desc:'Cargá un producto con precio y stock.',section:'productos' as SectionId},
  {id:'client',title:'Agregá tu primer cliente',desc:'Guardá sus datos para usarlo en ventas y presupuestos.',section:'clientes' as SectionId},
  {id:'sale',title:'Registrá tu primera venta',desc:'Asociá una venta a un cliente.',section:'ventas' as SectionId},
  {id:'budget',title:'Creá tu primer presupuesto',desc:'Generá un presupuesto con tu logo.',section:'presupuestos' as SectionId},
  {id:'cash',title:'Registrá un movimiento de caja',desc:'Cargá un ingreso o egreso para comenzar a controlar el saldo.',section:'caja' as SectionId},
  {id:'angi',title:'Conocé a ANGI',desc:'Probá una pregunta rápida al asistente.',section:'ia' as SectionId},
 ]
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return q?guides.filter(g=>`${g.title} ${g.text} ${g.steps.join(' ')}`.toLowerCase().includes(q)):guides},[query])
 const completedCount=firstSteps.filter(s=>done[s.id]).length
 const markDone=(id:string)=>{const next={...done,[id]:true};setDone(next);try{localStorage.setItem(`${storageKey}-help-progress`,JSON.stringify(next))}catch{}}
 const reset=()=>{setDone({});try{localStorage.removeItem(`${storageKey}-help-progress`)}catch{}}
 return <section className='large-section'>
   <div className='panel-heading'><div><span className='eyebrow'>CENTRO DE AYUDA</span><h2>Ayuda</h2><small>Aprendé a configurar y usar CASA ALLEGRA APP.</small></div></div>
   <div className='panel' style={{marginBottom:18}}>
    <div className='panel-heading'><div><h3>🚀 Primeros pasos</h3><small>Te guiamos desde cero para dejar la app lista.</small></div><strong>{completedCount}/{firstSteps.length}</strong></div>
    <div style={{height:10,background:'#eeeaf7',borderRadius:999,overflow:'hidden',margin:'10px 0 16px'}}><div style={{height:'100%',width:`${(completedCount/firstSteps.length)*100}%`,background:'linear-gradient(90deg,#a98bd8,#79c9c5)',transition:'width .2s'}}/></div>
    <div className='report-grid'>{firstSteps.map(step=><article key={step.id} className='report-card' style={{opacity:done[step.id] ? .72:1}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><strong>{done[step.id]?'✅ ':''}{step.title}</strong><small>{step.desc}</small></div></div><div className='toolbar' style={{marginTop:10}}><button type='button' className='primary-btn' onClick={()=>onGo(step.section)}>Ir ahora</button><button type='button' className='secondary-btn' onClick={()=>markDone(step.id)}>{done[step.id]?'Completado':'Marcar listo'}</button></div></article>)}</div>
    <button type='button' className='secondary-btn' onClick={reset} style={{marginTop:12}}>Reiniciar progreso</button>
   </div>
   <div className='panel' style={{marginBottom:18}}><label>🔎 Buscar en Ayuda</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Ej.: ¿cómo creo un presupuesto?' /></div>
   <div className='report-grid'>{filtered.map(g=><article key={g.id} className='panel' style={{margin:0}}><button type='button' style={{background:'none',border:0,padding:0,cursor:'pointer',textAlign:'left',width:'100%'}} onClick={()=>setOpen(open===g.id?'':g.id)}><div style={{display:'flex',gap:12,alignItems:'center'}}><span style={{fontSize:28}}>{g.icon}</span><div><h3 style={{margin:0}}>{g.title}</h3><small>{g.text}</small></div><span style={{marginLeft:'auto'}}>{open===g.id?'▲':'▼'}</span></div></button>{open===g.id&&<div style={{marginTop:14,borderTop:'1px solid #ece7f8',paddingTop:14}}><ol style={{paddingLeft:20,lineHeight:1.7}}>{g.steps.map((s,i)=><li key={i}>{s}</li>)}</ol><button type='button' className='primary-btn' onClick={()=>onGo(g.section)}>Abrir {g.title}</button></div>}</article>)}</div>
   {!filtered.length&&<div className='empty-state'>No encontramos esa ayuda. Probá con “producto”, “venta”, “pedido”, “presupuesto” o “ANGI”.</div>}
   <div className='panel' style={{marginTop:18}}><h3>❓ Preguntas frecuentes</h3><div className='trow'><span><b>¿Dónde empiezo?</b><small>Desde “Primeros pasos” en Inicio o desde esta pantalla.</small></span></div><div className='trow'><span><b>¿Dónde configuro mi logo?</b><small>En Presupuestos podés elegir el logo que aparecerá en el documento.</small></span></div><div className='trow'><span><b>¿Cómo consulto mis datos?</b><small>ANGI puede responder consultas sobre ventas, productos, stock, clientes, pedidos, caja y reportes.</small></span></div></div>
 </section>
}
