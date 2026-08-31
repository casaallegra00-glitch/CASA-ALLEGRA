'use client'

import { useMemo, useState } from 'react'

type ReportSale = { id:number; date:string; product:string; amount:number; quantity?:number; payment?:string; clientName?:string }
type ReportCash = { id:number; type:'ingreso'|'egreso'; detail:string; amount:number; date:string }
type ReportProduct = { id:number; name:string; category?:string; price:number; stock:number; minStock?:number; cost?:number; active?:boolean }
type ReportClient = { id:number; name:string }
type ReportOrder = { id:number; client:string; amount:number; status:string; date:string; deliveryDate?:string }

type Props = { sales:ReportSale[]; cash:ReportCash[]; products:ReportProduct[]; clients:ReportClient[]; orders:ReportOrder[] }

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)
const fmt=(d:string)=>new Date(d).toLocaleDateString('es-AR')

export default function ReportsManager({sales,cash,products,clients,orders}:Props){
 const [period,setPeriod]=useState<'month'|'30d'|'all'>('month')
 const now=new Date()
 const since=useMemo(()=>{if(period==='all')return 0;if(period==='30d'){const d=new Date();d.setDate(d.getDate()-30);return d.getTime()}return new Date(now.getFullYear(),now.getMonth(),1).getTime()},[period,now])
 const filteredSales=useMemo(()=>sales.filter(s=>new Date(s.date).getTime()>=since),[sales,since])
 const filteredCash=useMemo(()=>cash.filter(m=>new Date(m.date).getTime()>=since),[cash,since])
 const salesTotal=filteredSales.reduce((a,s)=>a+s.amount,0)
 const incomeTotal=filteredCash.filter(m=>m.type==='ingreso').reduce((a,m)=>a+m.amount,0)
 const expenseTotal=filteredCash.filter(m=>m.type==='egreso').reduce((a,m)=>a+m.amount,0)
 const net=incomeTotal-expenseTotal
 const units=filteredSales.reduce((a,s)=>a+(s.quantity||1),0)
 const average=filteredSales.length?salesTotal/filteredSales.length:0
 const lowStock=products.filter(p=>p.stock<=(p.minStock??5)).length
 const negativeStock=products.filter(p=>p.stock<0).length
 const delivered=orders.filter(o=>o.status==='Entregado').length
 const pending=orders.filter(o=>o.status==='Pendiente').length
 const production=orders.filter(o=>o.status==='En producción').length
 const ready=orders.filter(o=>o.status==='Listo').length
 const cancelled=orders.filter(o=>o.status==='Cancelado').length
 const topProducts=useMemo(()=>{const map=new Map<string,{name:string;units:number;amount:number}>();for(const s of filteredSales){const cur=map.get(s.product)||{name:s.product,units:0,amount:0};cur.units+=(s.quantity||1);cur.amount+=s.amount;map.set(s.product,cur)}return [...map.values()].sort((a,b)=>b.amount-a.amount).slice(0,8)},[filteredSales])
 const topClients=useMemo(()=>{const map=new Map<string,number>();for(const s of filteredSales)if(s.clientName)map.set(s.clientName,(map.get(s.clientName)||0)+s.amount);return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8)},[filteredSales])
 return <section className="panel large-section">
  <div className="panel-heading"><div><h2>Reportes</h2><small>Resumen de ventas, caja, productos, clientes y pedidos.</small></div><select value={period} onChange={e=>setPeriod(e.target.value as 'month'|'30d'|'all')}><option value="month">Este mes</option><option value="30d">Últimos 30 días</option><option value="all">Todo</option></select></div>
  <div className="report-grid">
   <div className="report-card"><small>Ventas</small><strong>{money(salesTotal)}</strong><span>{filteredSales.length} operaciones</span></div>
   <div className="report-card"><small>Ingresos</small><strong>{money(incomeTotal)}</strong><span>{units} unidades vendidas</span></div>
   <div className="report-card"><small>Egresos</small><strong>{money(expenseTotal)}</strong><span>Movimientos registrados</span></div>
   <div className="report-card"><small>Resultado</small><strong>{money(net)}</strong><span>Ingresos − egresos</span></div>
   <div className="report-card"><small>Ticket promedio</small><strong>{money(average)}</strong><span>Por operación</span></div>
   <div className="report-card"><small>Productos</small><strong>{products.length}</strong><span>{lowStock} con stock bajo · {negativeStock} en negativo</span></div>
   <div className="report-card"><small>Clientes</small><strong>{clients.length}</strong><span>Registrados</span></div>
   <div className="report-card"><small>Pedidos</small><strong>{orders.length}</strong><span>{delivered} entregados</span></div>
  </div>
  <div className="two-col" style={{marginTop:18}}>
   <div className="panel"><h3>Pedidos por estado</h3><div className="trow"><span>⏳ Pendientes</span><b>{pending}</b></div><div className="trow"><span>🛠️ En producción</span><b>{production}</b></div><div className="trow"><span>✅ Listos</span><b>{ready}</b></div><div className="trow"><span>📦 Entregados</span><b>{delivered}</b></div><div className="trow"><span>❌ Cancelados</span><b>{cancelled}</b></div></div>
   <div className="panel"><h3>Productos más vendidos</h3>{topProducts.length?topProducts.map(p=><div className="trow" key={p.name}><span><b>{p.name}</b><small>{p.units} unidades</small></span><b>{money(p.amount)}</b></div>):<div className="empty-state">Todavía no hay ventas en el período.</div>}</div>
  </div>
  <div className="two-col" style={{marginTop:18}}>
   <div className="panel"><h3>Clientes con mayor compra</h3>{topClients.length?topClients.map(([name,total])=><div className="trow" key={name}><span>{name}</span><b>{money(total)}</b></div>):<div className="empty-state">Las ventas con cliente asociado aparecerán acá.</div>}</div>
   <div className="panel"><h3>Situación del stock</h3><div className="trow"><span>Productos activos</span><b>{products.filter(p=>p.active!==false).length}</b></div><div className="trow"><span>Stock bajo</span><b>{lowStock}</b></div><div className="trow"><span>Stock negativo</span><b>{negativeStock}</b></div><div className="trow"><span>Sin unidades disponibles</span><b>{products.filter(p=>p.stock===0).length}</b></div></div>
  </div>
  <div className="panel" style={{marginTop:18}}><h3>Últimos movimientos</h3>{filteredCash.slice(0,10).map(m=><div className="trow" key={m.id}><span><b>{m.type==='ingreso'?'Ingreso':'Egreso'}</b><small>{m.detail} · {fmt(m.date)}</small></span><b>{m.type==='ingreso'?'+':'-'}{money(m.amount)}</b></div>)}{!filteredCash.length&&<div className="empty-state">No hay movimientos en el período.</div>}</div>
 </section>
}
