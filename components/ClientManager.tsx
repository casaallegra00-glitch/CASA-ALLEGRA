'use client'

import { FormEvent, useMemo, useState } from 'react'

type Client = { id:number; name:string; contact?:string; phone?:string; email?:string; address?:string; notes?:string }
type Order = { id:number; client:string; detail:string; status:string; amount:number; date:string }
type Sale = { id:number; date:string; product:string; amount:number }

type Props = { clients:Client[]; orders:Order[]; sales:Sale[]; onChange:(clients:Client[])=>void; onNotice:(message:string)=>void }

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)
const wa=(value:string)=>value.replace(/\D/g,'')

export default function ClientManager({clients,orders,sales,onChange,onNotice}:Props){
 const [query,setQuery]=useState('')
 const [selected,setSelected]=useState<Client|null>(null)
 const [editing,setEditing]=useState<Client|null>(null)
 const filtered=useMemo(()=>clients.filter(c=>`${c.name} ${c.contact||''} ${c.phone||''} ${c.email||''}`.toLowerCase().includes(query.toLowerCase())),[clients,query])
 const history=(c:Client)=>orders.filter(o=>o.client.toLowerCase()===c.name.toLowerCase())
 const saleHistory=(c:Client)=>sales.filter(s=>s.product.toLowerCase().includes(c.name.toLowerCase()))
 const total=(c:Client)=>history(c).reduce((a,o)=>a+o.amount,0)+saleHistory(c).reduce((a,s)=>a+s.amount,0)
 const lastDate=(c:Client)=>{const dates=[...history(c).map(o=>o.date),...saleHistory(c).map(s=>s.date)].map(d=>new Date(d).getTime()).filter(Boolean);return dates.length?new Date(Math.max(...dates)).toLocaleDateString('es-AR'):'Sin compras'}
 const add=(e:FormEvent)=>{e.preventDefault();const f=e.currentTarget as HTMLFormElement;const name=f.querySelector<HTMLInputElement>('[name=name]')?.value.trim()||'';const phone=f.querySelector<HTMLInputElement>('[name=phone]')?.value.trim()||'';const email=f.querySelector<HTMLInputElement>('[name=email]')?.value.trim()||'';const address=f.querySelector<HTMLInputElement>('[name=address]')?.value.trim()||'';const notes=f.querySelector<HTMLTextAreaElement>('[name=notes]')?.value.trim()||'';if(!name){onNotice('Ingresá el nombre del cliente.');return}if(clients.some(c=>c.name.trim().toLowerCase()===name.toLowerCase())){onNotice('Ese cliente ya está registrado.');return}onChange([{id:Date.now(),name,contact:phone,phone,email,address,notes},...clients]);f.reset();onNotice('Cliente agregado correctamente.')}
 const update=(e:FormEvent)=>{e.preventDefault();if(!editing)return;const f=e.currentTarget as HTMLFormElement;const name=f.querySelector<HTMLInputElement>('[name=name]')?.value.trim()||'';const phone=f.querySelector<HTMLInputElement>('[name=phone]')?.value.trim()||'';const email=f.querySelector<HTMLInputElement>('[name=email]')?.value.trim()||'';const address=f.querySelector<HTMLInputElement>('[name=address]')?.value.trim()||'';const notes=f.querySelector<HTMLTextAreaElement>('[name=notes]')?.value.trim()||'';if(!name){onNotice('Ingresá el nombre del cliente.');return}const next={...editing,name,contact:phone,phone,email,address,notes};onChange(clients.map(c=>c.id===editing.id?next:c));setEditing(null);setSelected(next);onNotice('Cliente actualizado.')}
 const remove=(c:Client)=>{if(!window.confirm(`¿Eliminar a ${c.name}?`))return;onChange(clients.filter(x=>x.id!==c.id));if(selected?.id===c.id)setSelected(null);onNotice('Cliente eliminado.')}
 return <>
  <section className="two-col">
   <div className="panel">
    <div className="panel-heading"><div><h2>Clientes</h2><small>{clients.length} cliente{clients.length===1?'':'s'} registrado{clients.length===1?'':'s'}</small></div><button className="secondary-btn" type="button" onClick={()=>setQuery('')}>Limpiar búsqueda</button></div>
    <div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔎 Buscar por nombre, teléfono o email..."/></div>
    <div className="client-list">
     {filtered.map(c=><div className="client-row" key={c.id} onClick={()=>setSelected(c)} style={{cursor:'pointer'}}><span className="client-avatar">👤</span><div style={{flex:1}}><strong>{c.name}</strong><small>{c.phone||c.contact||'Sin teléfono'}{c.email?` · ${c.email}`:''}</small><small>Compras: {money(total(c))} · Última: {lastDate(c)}</small></div><div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}><button type="button" className="secondary-btn" onClick={e=>{e.stopPropagation();setSelected(c)}}>Ver</button><button type="button" className="secondary-btn" onClick={e=>{e.stopPropagation();setEditing(c)}}>Editar</button><button type="button" className="secondary-btn" onClick={e=>{e.stopPropagation();remove(c)}}>Eliminar</button></div></div>)}
     {!filtered.length&&<div className="empty-state">{clients.length?'No encontramos clientes con esa búsqueda.':'Todavía no hay clientes.'}</div>}
    </div>
   </div>
   <form className="panel form-panel" onSubmit={add}><h2>Nuevo cliente</h2><small>Guardá los datos para reutilizarlos en pedidos y contacto.</small><label>Nombre y apellido *</label><input name="name" placeholder="Ej.: María González" required/><label>WhatsApp / teléfono</label><input name="phone" placeholder="Ej.: 11 1234-5678"/><label>Email</label><input name="email" type="email" placeholder="cliente@email.com"/><label>Dirección</label><input name="address" placeholder="Calle, número, localidad"/><label>Notas</label><textarea name="notes" rows={4} placeholder="Preferencias, indicaciones, etc."/><button className="primary-btn"><span>＋</span> Agregar cliente</button></form>
  </section>
  {selected&&<section className="panel large-section" style={{marginTop:18}}><div className="panel-heading"><div><h2>{selected.name}</h2><small>Ficha del cliente</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(selected.phone||selected.contact)&&<a className="primary-btn" href={`https://wa.me/${wa(selected.phone||selected.contact||'')}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>}<button className="secondary-btn" onClick={()=>setEditing(selected)}>✏️ Editar</button><button className="secondary-btn" onClick={()=>setSelected(null)}>Cerrar</button></div></div><div className="report-grid"><div className="report-card"><small>Total comprado</small><strong>{money(total(selected))}</strong></div><div className="report-card"><small>Última compra</small><strong>{lastDate(selected)}</strong></div><div className="report-card"><small>Pedidos</small><strong>{history(selected).length}</strong></div><div className="report-card"><small>Contacto</small><strong>{selected.phone||selected.contact||'—'}</strong></div></div><div className="panel report-detail"><p><b>Email:</b> {selected.email||'No informado'} · <b>Dirección:</b> {selected.address||'No informada'}</p><p><b>Notas:</b> {selected.notes||'Sin notas'}</p><h3>Historial de pedidos</h3>{history(selected).length?history(selected).map(o=><div className="trow" key={o.id}><span>{o.detail}</span><span>{new Date(o.date).toLocaleDateString('es-AR')}</span><b>{money(o.amount)}</b></div>):<div className="empty-state">No hay pedidos asociados todavía.</div>}</div></section>}
  {editing&&<div className="auth-overlay" onClick={()=>setEditing(null)}><form className="auth-modal" onSubmit={update} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setEditing(null)}>×</button><span className="eyebrow">CASA ALLEGRA APP</span><h2>Editar cliente</h2><label>Nombre y apellido *</label><input name="name" defaultValue={editing.name} required/><label>WhatsApp / teléfono</label><input name="phone" defaultValue={editing.phone||editing.contact||''}/><label>Email</label><input name="email" type="email" defaultValue={editing.email||''}/><label>Dirección</label><input name="address" defaultValue={editing.address||''}/><label>Notas</label><textarea name="notes" rows={4} defaultValue={editing.notes||''}/><button className="primary-btn full">Guardar cambios</button></form></div>}
 </>
}
