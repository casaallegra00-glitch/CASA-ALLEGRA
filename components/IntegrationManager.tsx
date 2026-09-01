'use client'

import { useEffect, useMemo, useState } from 'react'

type IntegrationKey = 'mercadopago'|'mercadolibre'|'mercadoenvios'|'andreani'|'correoargentino'
type Props = { storageKey:string; onNotice:(message:string)=>void }
type Movement = { id:string; date:string; type:'ingreso'|'egreso'; title:string; amount:number; client?:string; dni?:string; cuil?:string; alias?:string; cbu?:string; cvu?:string; status:string; detail?:string }
type MLOrder = { id:string; date:string; buyer:string; product:string; quantity:number; amount:number; payment:string; shipment:string; status:string; tracking?:string }

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)

export default function IntegrationManager({storageKey,onNotice}:Props){
 const [active,setActive]=useState<IntegrationKey>('mercadopago')
 const [connected,setConnected]=useState<Record<IntegrationKey,boolean>>({mercadopago:false,mercadolibre:false,mercadoenvios:false,andreani:false,correoargentino:false})
 const [configured,setConfigured]=useState<Record<IntegrationKey,boolean>>({mercadopago:false,mercadolibre:false,mercadoenvios:false,andreani:false,correoargentino:false})
 const [period,setPeriod]=useState('30')
 const [movements,setMovements]=useState<Movement[]>([])
 const [orders,setOrders]=useState<MLOrder[]>([])
 const [loading,setLoading]=useState(false)
 const [showSetup,setShowSetup]=useState(false)

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  const integration=params.get('integration')
  const connectedParam=params.get('connected')
  const error=params.get('error')
  if(integration==='mercadopago'){
   setActive('mercadopago')
   if(connectedParam==='1') onNotice('✅ Mercado Pago conectado correctamente. Ahora podés sincronizar.')
   if(error) onNotice(decodeURIComponent(error))
   if(connectedParam||error){params.delete('integration');params.delete('connected');params.delete('error');const query=params.toString();window.history.replaceState({},'',`${window.location.pathname}${query?`?${query}`:''}`)}
  }
  void refreshConnection('mercadopago')
 },[])

 const refreshConnection=async(key:IntegrationKey)=>{
  try{
   const res=await fetch(`/api/integrations/${key}`,{cache:'no-store'})
   const data=await res.json()
   setConnected(c=>({...c,[key]:Boolean(data.connected)}))
   setConfigured(c=>({...c,[key]:Boolean(data.configured)}))
  }catch{}
 }

 const periodStart=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-Number(period));return d.getTime()},[period])
 const filteredMovements=movements.filter(m=>new Date(m.date).getTime()>=periodStart)
 const income=filteredMovements.filter(m=>m.type==='ingreso').reduce((a,m)=>a+m.amount,0)
 const expenses=filteredMovements.filter(m=>m.type==='egreso').reduce((a,m)=>a+m.amount,0)
 const balance=income-expenses

 const connectMercadoPago=()=>{
  if(loading)return
  setLoading(true)
  window.location.assign('/api/integrations/mercadopago/connect')
 }

 const loadRemote=async(key:IntegrationKey)=>{
  if(key==='mercadopago'&&!connected.mercadopago){connectMercadoPago();return}
  setLoading(true)
  try{
   const endpoint=key==='mercadopago'?'/api/integrations/mercadopago/sync':`/api/integrations/${key}`
   const res=await fetch(endpoint,{cache:'no-store'})
   const data=await res.json()
   if(res.status===401&&key==='mercadopago'){connectMercadoPago();return}
   if(!res.ok)throw new Error(data?.error||data?.message||'La integración todavía no está configurada.')
   if(data.connected!==undefined)setConnected(c=>({...c,[key]:Boolean(data.connected)}))
   if(Array.isArray(data.movements))setMovements(data.movements)
   if(Array.isArray(data.orders))setOrders(data.orders)
   onNotice(data.message||'Integración actualizada.')
  }catch(err){onNotice(err instanceof Error?err.message:'No se pudo actualizar la integración.')}
  finally{setLoading(false)}
 }
 const card=(key:IntegrationKey,title:string,subtitle:string)=>{const is=active===key;return <button type='button' onClick={()=>{setActive(key);void refreshConnection(key)}} style={{textAlign:'left',padding:16,borderRadius:16,border:is?'2px solid #4AA7A8':'1px solid #E2E8EA',background:is?'#F3FAFA':'#fff',cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{title}</strong><span style={{fontSize:11,fontWeight:900,color:connected[key]?'#18794E':'#7A6B25'}}>{connected[key]?'CONECTADO':'NO CONECTADO'}</span></div><small style={{display:'block',marginTop:6,opacity:.72}}>{subtitle}</small></button>}
 const title=active==='mercadopago'?'Mercado Pago':active==='mercadolibre'?'Mercado Libre':active==='mercadoenvios'?'Mercado Envíos':active==='andreani'?'Andreani':'Correo Argentino'
 return <section className='panel large-section'>
  <div className='panel-heading'><div><span className='eyebrow'>CONEXIONES</span><h2>Integraciones</h2><small>Conectá tus plataformas de cobro, ventas y envíos desde un solo lugar.</small></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option value='7'>Últimos 7 días</option><option value='30'>Últimos 30 días</option><option value='90'>Últimos 90 días</option><option value='365'>Último año</option></select></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginBottom:18}}>{card('mercadopago','💳 Mercado Pago','Cobros, transferencias, ingresos, egresos y resumen de cuenta.')}{card('mercadolibre','🛒 Mercado Libre','Ventas, pagos, compradores y estado de las órdenes.')}{card('mercadoenvios','📦 Mercado Envíos','Envíos, seguimiento y estados vinculados a Mercado Libre.')}{card('andreani','🚚 Andreani','Gestión y seguimiento de envíos propios.')}{card('correoargentino','📮 Correo Argentino','Gestión y seguimiento de envíos propios.')}</div>
  <div className='panel' style={{marginBottom:18}}><div className='panel-heading'><div><h3>{title}</h3><small>{connected[active]?'Conexión activa':active==='mercadopago'&&configured.mercadopago?'Listo para conectar tu cuenta de Mercado Pago.':'Conectá la cuenta para habilitar la sincronización.'}</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{active==='mercadopago'&&!connected.mercadopago&&<button type='button' className='primary-btn' onClick={connectMercadoPago} disabled={loading}>Conectar Mercado Pago</button>}{active!=='mercadopago'&&<button type='button' className='secondary-btn' onClick={()=>setShowSetup(v=>!v)}>{showSetup?'Cerrar configuración':'Configurar'}</button>}{active!=='mercadopago'&&<button type='button' className='primary-btn' onClick={()=>void loadRemote(active)} disabled={loading}>{loading?'Actualizando…':'Sincronizar'}</button>}{active==='mercadopago'&&connected.mercadopago&&<button type='button' className='primary-btn' onClick={()=>void loadRemote(active)} disabled={loading}>{loading?'Actualizando…':'Sincronizar Mercado Pago'}</button>}</div></div>
   {showSetup&&active!=='mercadopago'&&<div className='panel' style={{marginTop:12,background:'#F8FBFC'}}><h4>Configuración segura</h4><p style={{marginTop:0}}>Las claves privadas permanecen en el servidor. Para Mercado Pago, el botón Conectar abre la autorización oficial y luego vuelve a CASA ALLEGRA.</p><div className='trow'><span>Mercado Pago</span><small>MP_CLIENT_ID · MP_CLIENT_SECRET · MP_REDIRECT_URI · MP_TOKEN_ENCRYPTION_KEY</small></div><div className='trow'><span>Mercado Libre</span><small>ML_CLIENT_ID · ML_CLIENT_SECRET · ML_REDIRECT_URI</small></div><div className='trow'><span>Andreani</span><small>Credenciales/API según contrato del servicio</small></div><div className='trow'><span>Correo Argentino</span><small>Credenciales/API según servicio habilitado</small></div></div>}
  </div>
  {active==='mercadopago'&&<><div className='report-grid'><div className='report-card'><small>Ingresos</small><strong>{money(income)}</strong><span>{filteredMovements.filter(m=>m.type==='ingreso').length} movimientos</span></div><div className='report-card'><small>Egresos</small><strong>{money(expenses)}</strong><span>{filteredMovements.filter(m=>m.type==='egreso').length} movimientos</span></div><div className='report-card'><small>Neto</small><strong>{money(balance)}</strong><span>Ingresos − egresos</span></div></div><div className='panel' style={{marginTop:18}}><h3>Movimientos de Mercado Pago</h3>{filteredMovements.length?filteredMovements.map(m=><div className='trow' key={m.id}><span><b>{m.title}</b><small>{new Date(m.date).toLocaleString('es-AR')} · {m.status}{m.client?` · ${m.client}`:''}{m.alias?` · Alias ${m.alias}`:''}{m.cbu?` · CBU ${m.cbu}`:''}{m.cvu?` · CVU ${m.cvu}`:''}{m.dni?` · DNI ${m.dni}`:''}{m.cuil?` · CUIL ${m.cuil}`:''}{m.detail?` · ${m.detail}`:''}</small></span><b>{m.type==='ingreso'?'+':'-'}{money(m.amount)}</b></div>):<div className='empty-state'>{connected.mercadopago?'No hay pagos/movimientos dentro del período elegido.':'Conectá Mercado Pago para importar datos reales.'}</div>}</div></>}
  {active==='mercadolibre'&&<><div className='report-grid'><div className='report-card'><small>Ventas</small><strong>{orders.length}</strong><span>Órdenes sincronizadas</span></div><div className='report-card'><small>Importe vendido</small><strong>{money(orders.reduce((a,o)=>a+o.amount,0))}</strong><span>Total bruto</span></div><div className='report-card'><small>Envíos</small><strong>{orders.filter(o=>o.shipment!=='Sin envío').length}</strong><span>Órdenes con envío</span></div></div><div className='panel' style={{marginTop:18}}><h3>Ventas de Mercado Libre</h3>{orders.length?orders.map(o=><div className='trow' key={o.id}><span><b>{o.product} ×{o.quantity}</b><small>{o.date} · {o.buyer} · Pago: {o.payment} · Envío: {o.shipment}{o.tracking?` · Tracking ${o.tracking}`:''}</small></span><b>{money(o.amount)}</b></div>):<div className='empty-state'>No hay ventas sincronizadas.</div>}</div></>}
  {active==='mercadoenvios'&&<div className='panel'><h3>Mercado Envíos</h3>{orders.length?orders.map(o=><div className='trow' key={o.id}><span><b>{o.product}</b><small>{o.buyer} · {o.shipment}{o.tracking?` · Tracking ${o.tracking}`:''}</small></span><b>{o.status}</b></div>):<div className='empty-state'>Los envíos aparecerán cuando haya órdenes sincronizadas de Mercado Libre.</div>}</div>}
  {(active==='andreani'||active==='correoargentino')&&<div className='panel'><h3>{title}</h3><div className='empty-state'>Preparado para vincular seguimiento, destinatario, código de tracking, estado e historial de envíos cuando se configure la API correspondiente.</div></div>}
  <div className='panel' style={{marginTop:18}}><h3>⚠️ Datos sensibles</h3><p style={{marginBottom:0}}>CASA ALLEGRA solo mostrará los datos personales y bancarios que la API autorizada entregue. No se inventarán DNI, CUIL, CBU, CVU, alias ni otros datos.</p></div>
 </section>
}
