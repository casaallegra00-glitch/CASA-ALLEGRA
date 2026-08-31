'use client'

import { useEffect, useMemo, useState } from 'react'

type Product = { id:number; name:string; stock:number; minStock?:number; unit?:string; sku?:string }
type Order = { id:number; number?:string; client:string; status:string; date:string; deliveryDate?:string }
type AlertItem = { id:string; type:'critical'|'warning'|'info'; title:string; message:string; action?:'productos'|'pedidos' }
type Props = { products:Product[]; orders:Order[]; storageKey?:string; onGo:(section:'productos'|'pedidos')=>void }

const emptyRead:string[]=[]

export default function NotificationsManager({products,orders,storageKey='casa-allegra-notifications',onGo}:Props){
 const [read,setRead]=useState<string[]>(emptyRead)
 const [hidden,setHidden]=useState<string[]>([])
 const [filter,setFilter]=useState<'all'|'unread'|'important'>('all')

 useEffect(()=>{try{const r=localStorage.getItem(`${storageKey}-read`);const h=localStorage.getItem(`${storageKey}-hidden`);if(r)setRead(JSON.parse(r));if(h)setHidden(JSON.parse(h))}catch{}} ,[storageKey])
 useEffect(()=>{try{localStorage.setItem(`${storageKey}-read`,JSON.stringify(read))}catch{}} ,[storageKey,read])
 useEffect(()=>{try{localStorage.setItem(`${storageKey}-hidden`,JSON.stringify(hidden))}catch{}} ,[storageKey,hidden])

 const alerts=useMemo<AlertItem[]>(()=>{
  const items:AlertItem[]=[]
  for(const p of products){
   const min=p.minStock??5
   if(p.stock<0) items.push({id:`negative-stock-${p.id}`,type:'critical',title:'Stock negativo',message:`${p.name} está en ${p.stock} ${p.unit||'unidades'}. Revisá el inventario.`,action:'productos'})
   else if(p.stock<=min) items.push({id:`low-stock-${p.id}`,type:'warning',title:'Stock bajo',message:`${p.name} tiene ${p.stock} ${p.unit||'unidades'} disponibles (mínimo: ${min}).`,action:'productos'})
  }
  const today=new Date();today.setHours(0,0,0,0)
  for(const o of orders){
   const done=['Entregado','Cancelado'].includes(o.status)
   if(!done && o.status==='Pendiente') items.push({id:`pending-order-${o.id}`,type:'info',title:'Pedido pendiente',message:`${o.number||`PED-${o.id}`} · ${o.client} todavía está pendiente.`,action:'pedidos'})
   const due=o.deliveryDate
   if(!done&&due){
    const d=new Date(`${due}T00:00:00`)
    if(d<today) items.push({id:`overdue-order-${o.id}-${due}`,type:'critical',title:'Entrega vencida',message:`${o.number||`PED-${o.id}`} · ${o.client} tenía entrega para ${d.toLocaleDateString('es-AR')}.`,action:'pedidos'})
   }
  }
  return items
 },[products,orders])

 const visible=useMemo(()=>alerts.filter(a=>!hidden.includes(a.id)&& (filter==='all'||(filter==='unread'&&!read.includes(a.id))||(filter==='important'&&a.type!=='info'))),[alerts,hidden,filter,read])
 const unread=alerts.filter(a=>!hidden.includes(a.id)&&!read.includes(a.id)).length
 const important=alerts.filter(a=>!hidden.includes(a.id)&&a.type!=='info').length
 const markRead=(id:string)=>setRead(v=>v.includes(id)?v:[...v,id])
 const markAllRead=()=>setRead(v=>Array.from(new Set([...v, ...alerts.map(a=>a.id)])))
 const dismiss=(id:string)=>{setHidden(v=>v.includes(id)?v:[...v,id]);setRead(v=>v.filter(x=>x!==id))}
 const clearHidden=()=>setHidden([])
 const meta=(type:AlertItem['type'])=>type==='critical'?{icon:'🚨',label:'URGENTE'}:type==='warning'?{icon:'⚠️',label:'ATENCIÓN'}:{icon:'🔔',label:'AVISO'}

 return <section className="panel large-section">
  <div className="panel-heading">
   <div><span className="eyebrow">CENTRO DE AVISOS</span><h2>Notificaciones</h2><small>Alertas automáticas de CASA ALLEGRA APP.</small></div>
   <strong>{unread} sin leer</strong>
  </div>
  <div className="report-grid" style={{marginBottom:18}}>
   <div className="report-card"><small>Sin leer</small><strong>{unread}</strong><span>Requieren revisión</span></div>
   <div className="report-card"><small>Importantes</small><strong>{important}</strong><span>Stock o entregas</span></div>
   <div className="report-card"><small>Pedidos pendientes</small><strong>{orders.filter(o=>o.status==='Pendiente').length}</strong><span>Estado pendiente</span></div>
   <div className="report-card"><small>Stock bajo/negativo</small><strong>{products.filter(p=>p.stock<=((p.minStock??5))).length}</strong><span>Productos a revisar</span></div>
  </div>
  <div className="toolbar">
   <button type="button" className={filter==='all'?'primary-btn':'secondary-btn'} onClick={()=>setFilter('all')}>Todas ({alerts.filter(a=>!hidden.includes(a.id)).length})</button>
   <button type="button" className={filter==='unread'?'primary-btn':'secondary-btn'} onClick={()=>setFilter('unread')}>Sin leer ({unread})</button>
   <button type="button" className={filter==='important'?'primary-btn':'secondary-btn'} onClick={()=>setFilter('important')}>Importantes ({important})</button>
   <button type="button" className="secondary-btn" onClick={markAllRead}>✓ Marcar todas como leídas</button>
   {hidden.length>0&&<button type="button" className="secondary-btn" onClick={clearHidden}>↩ Mostrar ocultas</button>}
  </div>
  <div className="table" style={{marginTop:14}}>
   {visible.map(a=>{const m=meta(a.type);const isRead=read.includes(a.id);return <article key={a.id} className="trow" style={{alignItems:'flex-start',gap:12,opacity:isRead?.72:1}}>
    <span style={{fontSize:22,minWidth:30}}>{m.icon}</span>
    <span style={{flex:1}}><b>{a.title}</b><small>{a.message}</small><small style={{fontWeight:800}}>{m.label}{isRead?' · LEÍDA':''}</small></span>
    <div style={{display:'flex',gap:7,flexWrap:'wrap',justifyContent:'flex-end'}}>
      {a.action&&<button type="button" className="secondary-btn" onClick={()=>{markRead(a.id);onGo(a.action!)}}>Ver</button>}
      {!isRead&&<button type="button" className="secondary-btn" onClick={()=>markRead(a.id)}>Marcar leída</button>}
      <button type="button" className="secondary-btn" onClick={()=>dismiss(a.id)}>Ocultar</button>
    </div>
   </article>})}
   {!visible.length&&<div className="empty-state">🎉 No hay notificaciones para mostrar.</div>}
  </div>
 </section>
}
