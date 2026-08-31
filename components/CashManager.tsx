'use client'
import { FormEvent, useMemo, useState } from 'react'

type CashMove = { id:number; type:'ingreso'|'egreso'; detail:string; amount:number; date:string; category?:string }
type Props = { cash:CashMove[]; onChange:(cash:CashMove[])=>void; onNotice:(message:string)=>void }
const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)
const categories=['Ventas','Compra de materiales','Proveedores','Servicios','Alquiler','Impuestos','Sueldos','Otros']

export default function CashManager({cash,onChange,onNotice}:Props){
 const [type,setType]=useState<'ingreso'|'egreso'>('ingreso')
 const [detail,setDetail]=useState('')
 const [amount,setAmount]=useState('')
 const [category,setCategory]=useState('Otros')
 const [date,setDate]=useState(new Date().toISOString().slice(0,10))
 const [query,setQuery]=useState('')
 const ingresos=useMemo(()=>cash.filter(m=>m.type==='ingreso').reduce((a,m)=>a+m.amount,0),[cash])
 const egresos=useMemo(()=>cash.filter(m=>m.type==='egreso').reduce((a,m)=>a+m.amount,0),[cash])
 const balance=ingresos-egresos
 const filtered=useMemo(()=>cash.filter(m=>`${m.detail} ${m.category||''}`.toLowerCase().includes(query.toLowerCase())),[cash,query])
 const submit=(e:FormEvent)=>{e.preventDefault();const clean=detail.trim();const value=Number(amount);if(!clean){onNotice('⚠️ Ingresá un concepto.');return}if(!Number.isFinite(value)||value<=0){onNotice('⚠️ El importe debe ser mayor a $0.');return}if(!date){onNotice('⚠️ Seleccioná una fecha.');return}const move:CashMove={id:Date.now(),type,detail:clean,amount:value,date:new Date(date+'T12:00:00').toISOString(),category};onChange([move,...cash]);setDetail('');setAmount('');onNotice(type==='ingreso'?'✅ Ingreso registrado.':'✅ Egreso registrado.')}
 const remove=(m:CashMove)=>{if(!window.confirm(`¿Eliminar este ${m.type} de ${money(m.amount)}?`))return;onChange(cash.filter(x=>x.id!==m.id));onNotice('Movimiento eliminado.')}
 return <section className="large-section">
  <div className="report-grid" style={{marginBottom:18}}>
   <div className="report-card"><small>Saldo actual</small><strong>{money(balance)}</strong></div>
   <div className="report-card"><small>Total ingresos</small><strong>{money(ingresos)}</strong></div>
   <div className="report-card"><small>Total egresos</small><strong>{money(egresos)}</strong></div>
   <div className="report-card"><small>Movimientos</small><strong>{cash.length}</strong></div>
  </div>
  <div className="two-col">
   <div className="panel">
    <div className="panel-heading"><div><h2>Movimientos de caja</h2><small>Registrá ingresos y egresos del negocio.</small></div></div>
    <div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔎 Buscar movimiento..."/><button type="button" className={type==='ingreso'?'primary-btn':'secondary-btn'} onClick={()=>setType('ingreso')}>＋ Ingreso</button><button type="button" className={type==='egreso'?'primary-btn':'secondary-btn'} onClick={()=>setType('egreso')}>− Egreso</button></div>
    <div className="table">{filtered.map(m=><div className="trow" key={m.id}><span><b>{m.type==='ingreso'?'Ingreso':'Egreso'} · {m.detail}</b><small>{m.category||'Otros'} · {new Date(m.date).toLocaleDateString('es-AR')}</small></span><b>{m.type==='ingreso'?'+':'-'}{money(m.amount)}</b><button type="button" className="secondary-btn" onClick={()=>remove(m)}>🗑️</button></div>)}{!filtered.length&&<div className="empty-state">{cash.length?'No encontramos movimientos.':'Todavía no hay movimientos de caja.'}</div>}</div>
   </div>
   <form className="panel form-panel" onSubmit={submit}>
    <h2>{type==='ingreso'?'Registrar ingreso':'Registrar egreso'}</h2>
    <label>Concepto *</label><input value={detail} onChange={e=>setDetail(e.target.value)} placeholder={type==='ingreso'?'Ej.: Venta de productos':'Ej.: Compra de papel'} required/>
    <label>Importe *</label><input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="$ 0" required/>
    <label>Categoría</label><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
    <label>Fecha *</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/>
    <button className="primary-btn">{type==='ingreso'?'Registrar ingreso':'Registrar egreso'}</button>
   </form>
  </div>
 </section>
}
