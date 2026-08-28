'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Provider = 'mercadopago' | 'mercadolibre'
type ShippingProvider = 'andreani' | 'correoargentino'
type Status = 'checking' | 'connected' | 'disconnected'

type Payment = {
  id: string | number | null
  createdAt: string | null
  approvedAt: string | null
  status: string | null
  currency: string
  amount: number
  netAmount: number | null
  paymentMethod: string | null
  paymentType: string | null
  payer: { email: string | null; firstName: string | null; lastName: string | null }
}

type Order = {
  id: string
  status: string
  dateCreated: string | null
  dateClosed: string | null
  total: number
  currency: string
  buyer: { id: string | number | null; nickname: string | null; firstName: string | null; lastName: string | null; email: string | null }
  items: Array<{ id: string | null; title: string | null; quantity: number; unitPrice: number | null }>
  payments: Array<{ id: string | number; status: string | null; transactionAmount: number | null }>
}

type Card = { icon: string; name: string; kind: string; description: string; provider?: Provider; note?: string }

const cards: Card[] = [
  { icon: '💳', name: 'Mercado Pago', kind: 'Cobros recibidos', description: 'Cada negocio conecta su propia cuenta. CASA ALLEGRA consulta cobros de esa cuenta y no usa una cuenta global.', provider: 'mercadopago' },
  { icon: '🛒', name: 'Mercado Libre', kind: 'Ventas y compradores', description: 'Cada negocio conecta su propia cuenta para consultar ventas, compradores y envíos.', provider: 'mercadolibre' },
  { icon: '📦', name: 'Mercado Envíos', kind: 'Estado y etiquetas', description: 'Usa la cuenta de Mercado Libre conectada para consultar estados y obtener etiquetas.', note: 'Vinculado a Mercado Libre' },
]

const money = (amount: number, currency = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('es-AR') : '—'

export default function IntegracionesPage() {
  const [status, setStatus] = useState<Record<Provider, Status>>({ mercadopago: 'checking', mercadolibre: 'checking' })
  const [shippingStatus, setShippingStatus] = useState<Record<ShippingProvider, Status>>({ andreani: 'checking', correoargentino: 'checking' })
  const [message, setMessage] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsError, setPaymentsError] = useState('')
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersError, setOrdersError] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [shipmentId, setShipmentId] = useState('')
  const [shipmentData, setShipmentData] = useState<any>(null)
  const [shipmentError, setShipmentError] = useState('')
  const [loadingShipment, setLoadingShipment] = useState(false)
  const [andreaniTracking, setAndreaniTracking] = useState('')
  const [correoTracking, setCorreoTracking] = useState('')
  const [correoLabelData, setCorreoLabelData] = useState<any>(null)
  const [correoError, setCorreoError] = useState('')
  const [andreaniError, setAndreaniError] = useState('')
  const [credentials, setCredentials] = useState({ andreani: { apiKey: '', account: '', username: '', password: '' }, correoargentino: { agreement: '', apiKey: '', sellerId: '' } })

  const authToken = async () => (await supabase?.auth.getSession())?.data.session?.access_token || ''

  const loadPayments = async () => {
    setPaymentsError(''); setLoadingPayments(true)
    try {
      const token = await authToken(); if (!token) throw new Error('Iniciá sesión en CASA ALLEGRA.')
      const response = await fetch('/api/mercadopago/received', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'No se pudieron consultar los cobros.')
      setPayments(Array.isArray(body.payments) ? body.payments : [])
    } catch (e) { setPaymentsError(e instanceof Error ? e.message : 'No se pudieron consultar los cobros.') } finally { setLoadingPayments(false) }
  }

  const loadOrders = async () => {
    setOrdersError(''); setLoadingOrders(true)
    try {
      const token = await authToken(); if (!token) throw new Error('Iniciá sesión en CASA ALLEGRA.')
      const response = await fetch('/api/mercadolibre/orders?limit=20', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'No se pudieron consultar las ventas.')
      setOrders(Array.isArray(body.orders) ? body.orders : [])
    } catch (e) { setOrdersError(e instanceof Error ? e.message : 'No se pudieron consultar las ventas.') } finally { setLoadingOrders(false) }
  }

  const loadShipment = async () => {
    setShipmentError(''); setShipmentData(null)
    if (!shipmentId.trim()) { setShipmentError('Ingresá el ID del envío de Mercado Envíos.'); return }
    setLoadingShipment(true)
    try {
      const token = await authToken(); if (!token) throw new Error('Iniciá sesión en CASA ALLEGRA.')
      const response = await fetch(`/api/mercadolibre/shipments?orderId=${encodeURIComponent(shipmentId.trim())}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'No se pudo consultar el envío.')
      setShipmentData(body)
    } catch (e) { setShipmentError(e instanceof Error ? e.message : 'No se pudo consultar el envío.') } finally { setLoadingShipment(false) }
  }

  const loadShippingStatus = async (provider: ShippingProvider) => {
    try {
      const token = await authToken(); if (!token) { setShippingStatus(s => ({ ...s, [provider]: 'disconnected' })); return }
      const response = await fetch(`/api/integraciones/${provider}/credentials`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const body = await response.json().catch(() => ({}))
      setShippingStatus(s => ({ ...s, [provider]: body.connected ? 'connected' : 'disconnected' }))
    } catch { setShippingStatus(s => ({ ...s, [provider]: 'disconnected' })) }
  }

  const saveShipping = async (provider: ShippingProvider) => {
    setConnecting(provider); setMessage('')
    try {
      const token = await authToken(); if (!token) throw new Error('Iniciá sesión en CASA ALLEGRA.')
      const response = await fetch(`/api/integraciones/${provider}/credentials`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials[provider]) })
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'No se pudieron guardar las credenciales.')
      setShippingStatus(s => ({ ...s, [provider]: 'connected' })); setMessage(`La cuenta de ${provider === 'andreani' ? 'Andreani' : 'Correo Argentino'} quedó vinculada a este negocio de CASA ALLEGRA.`)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo guardar la cuenta.') } finally { setConnecting(null) }
  }

  const connect = async (provider: Provider) => {
    if (connecting) return
    setMessage(''); setConnecting(provider)
    try {
      const token = await authToken(); if (!token) throw new Error('Iniciá sesión en CASA ALLEGRA.')
      const response = await fetch(`/api/integraciones/${provider}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'No se pudo iniciar la conexión.')
      window.location.href = body.url
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo iniciar la conexión.'); setConnecting(null) }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!supabase) { setLoggedIn(false); return }
      const { data } = await supabase.auth.getSession(); if (!active) return
      const token = data.session?.access_token || ''; setLoggedIn(Boolean(token))
      if (!token) { setStatus({ mercadopago: 'disconnected', mercadolibre: 'disconnected' }); setShippingStatus({ andreani: 'disconnected', correoargentino: 'disconnected' }); return }
      const headers = { Authorization: `Bearer ${token}` }
      const [mp, ml] = await Promise.all([
        fetch('/api/integraciones/mercadopago/status', { cache: 'no-store', headers }).then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/integraciones/mercadolibre/status', { cache: 'no-store', headers }).then(r => r.json()).catch(() => ({ connected: false })),
      ])
      if (!active) return
      setStatus({ mercadopago: mp.connected ? 'connected' : 'disconnected', mercadolibre: ml.connected ? 'connected' : 'disconnected' })
      const params = new URLSearchParams(window.location.search)
      if (params.get('oauth')) setMessage(`${params.get('oauth') === 'mercadopago' ? 'Mercado Pago' : 'Mercado Libre'} quedó conectado a tu cuenta de CASA ALLEGRA.`)
      if (params.get('oauth_error')) setMessage(`No se pudo conectar: ${params.get('reason') || 'error de autorización'}.`)
      if (mp.connected) await loadPayments()
      if (ml.connected) await loadOrders()
      await Promise.all([loadShippingStatus('andreani'), loadShippingStatus('correoargentino')])
    }
    load(); return () => { active = false }
  }, [])

  const totalReceived = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments])
  const statusLabel = (s: Status) => s === 'checking' ? '○ Comprobando…' : s === 'connected' ? '● Cuenta conectada' : '○ Sin conectar'

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Integraciones</h1>
        <p style={{ color: '#6f6570' }}>Cada usuario y cada negocio conecta sus propias cuentas. CASA ALLEGRA no comparte cuentas ni credenciales entre negocios.</p>
        {!loggedIn && <p style={{ padding: 12, background: '#fff0d9', borderRadius: 10 }}>Iniciá sesión para conectar servicios.</p>}
        {message && <p style={{ padding: 12, background: '#eaf8ed', borderRadius: 10 }}>{message}</p>}

        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', marginTop: 24 }}>
          {cards.map(card => <article key={card.name} style={{ padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
            <div style={{ fontSize: 28 }}>{card.icon}</div><h2 style={{ margin: '8px 0' }}>{card.name}</h2><small>{card.kind}</small><p>{card.description}</p>
            {card.provider ? <><strong>{statusLabel(status[card.provider])}</strong><div style={{ marginTop: 14 }}><button type="button" onClick={() => connect(card.provider!)} disabled={connecting !== null || status[card.provider!] === 'checking'}>{connecting === card.provider ? 'Conectando…' : status[card.provider!] === 'connected' ? 'Cambiar cuenta' : 'Conectar cuenta del negocio'}</button></div></> : <p><small>{card.note}</small></p>}
          </article>)}
        </section>

        {status.mercadopago === 'connected' && <section style={{ marginTop: 28, padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>Cobros recibidos de este negocio</h2><p style={{ margin: '6px 0', color: '#6f6570' }}>Información que Mercado Pago expone para los pagos de la cuenta conectada.</p></div><button onClick={loadPayments} disabled={loadingPayments}>{loadingPayments ? 'Actualizando…' : 'Actualizar cobros'}</button></div>
          {paymentsError && <p style={{ color: '#b42318' }}>{paymentsError}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '18px 0' }}><div style={{ padding: 16, background: '#f6fbf7', borderRadius: 14 }}><small>Total visible</small><div style={{ fontSize: 26, fontWeight: 800 }}>{money(totalReceived)}</div></div><div style={{ padding: 16, background: '#faf7ff', borderRadius: 14 }}><small>Operaciones</small><div style={{ fontSize: 26, fontWeight: 800 }}>{payments.length}</div></div></div>
          {payments.length > 0 && <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}><thead><tr>{['Fecha','Pagador','Importe','Medio','Estado'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eadfe0' }}>{h}</th>)}</tr></thead><tbody>{payments.map(p => <tr key={String(p.id)}><td style={{ padding: 10 }}>{formatDate(p.approvedAt || p.createdAt)}</td><td style={{ padding: 10 }}><strong>{[p.payer.firstName,p.payer.lastName].filter(Boolean).join(' ') || 'Pagador no informado'}</strong><br/><small>{p.payer.email || 'Email no informado'}</small></td><td style={{ padding: 10 }}><strong>{money(p.amount,p.currency)}</strong></td><td style={{ padding: 10 }}>{p.paymentMethod || p.paymentType || 'Mercado Pago'}</td><td style={{ padding: 10 }}>{p.status || 'approved'}</td></tr>)}</tbody></table></div>}
        </section>}

        {status.mercadolibre === 'connected' && <section style={{ marginTop: 28, padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>Mercado Libre · Ventas y compradores</h2><p style={{ margin: '6px 0', color: '#6f6570' }}>Ventas de la cuenta de Mercado Libre conectada a este negocio.</p></div><button onClick={loadOrders} disabled={loadingOrders}>{loadingOrders ? 'Actualizando…' : 'Actualizar ventas'}</button></div>
          {ordersError && <p style={{ color: '#b42318' }}>{ordersError}</p>}
          {orders.length > 0 && <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}><thead><tr>{['Orden','Fecha','Comprador','Productos','Total','Estado'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eadfe0' }}>{h}</th>)}</tr></thead><tbody>{orders.map(o => <tr key={o.id}><td style={{ padding: 10 }}>{o.id}</td><td style={{ padding: 10 }}>{formatDate(o.dateCreated)}</td><td style={{ padding: 10 }}><strong>{[o.buyer.firstName,o.buyer.lastName].filter(Boolean).join(' ') || o.buyer.nickname || 'Comprador'}</strong><br/><small>{o.buyer.email || 'Email no informado'}</small></td><td style={{ padding: 10 }}>{o.items.map(i => `${i.title || i.id || 'Producto'} × ${i.quantity}`).join(', ')}</td><td style={{ padding: 10 }}>{money(o.total,o.currency)}</td><td style={{ padding: 10 }}>{o.status}</td></tr>)}</tbody></table></div>}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #eadfe0' }}><h2>Mercado Envíos · Estado del envío</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input value={shipmentId} onChange={e => setShipmentId(e.target.value)} placeholder="ID de orden de Mercado Libre"/><button onClick={loadShipment} disabled={loadingShipment}>{loadingShipment ? 'Consultando…' : 'Ver envío'}</button></div>{shipmentError && <p style={{ color: '#b42318' }}>{shipmentError}</p>}{shipmentData?.shipments?.map((s:any) => <div key={String(s.id || s.shipment_id)} style={{ marginTop: 12, padding: 14, background: '#faf7ff', borderRadius: 12 }}><strong>Envío {s.id || s.shipment_id}</strong><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify({status: s.status, substatus: s.substatus, tracking_number: s.tracking_number, date_created: s.date_created, detail: s.detail?.status_history}, null, 2)}</pre>{(s.id || s.shipment_id) && <a href={`/api/mercadolibre/labels?shipment_ids=${encodeURIComponent(String(s.id || s.shipment_id))}&format=pdf`}>Imprimir etiqueta</a>}</div>)}</div>
        </section>}

        <section style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
          <article style={{ padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}><h2>🚚 Andreani</h2><p>Cuenta propia de cada negocio. Guardamos las credenciales cifradas por usuario y evitamos compartirlas.</p><strong>{statusLabel(shippingStatus.andreani)}</strong><div style={{ display: 'grid', gap: 8, marginTop: 12 }}><input type="text" placeholder="API Key" value={credentials.andreani.apiKey} onChange={e => setCredentials(c => ({ ...c, andreani: { ...c.andreani, apiKey: e.target.value } }))}/><input type="text" placeholder="N.º de cuenta" value={credentials.andreani.account} onChange={e => setCredentials(c => ({ ...c, andreani: { ...c.andreani, account: e.target.value } }))}/><input type="text" placeholder="Usuario (si corresponde)" value={credentials.andreani.username} onChange={e => setCredentials(c => ({ ...c, andreani: { ...c.andreani, username: e.target.value } }))}/><input type="password" placeholder="Contraseña (si corresponde)" value={credentials.andreani.password} onChange={e => setCredentials(c => ({ ...c, andreani: { ...c.andreani, password: e.target.value } }))}/><button onClick={() => saveShipping('andreani')} disabled={connecting === 'andreani'}>{connecting === 'andreani' ? 'Guardando…' : 'Conectar cuenta de este negocio'}</button>{andreaniTracking && <a href={`https://andreani.com/envio/${encodeURIComponent(andreaniTracking)}`} target="_blank" rel="noreferrer">Abrir seguimiento Andreani</a>}<input type="text" placeholder="Tracking Andreani" value={andreaniTracking} onChange={e => { setAndreaniTracking(e.target.value); setAndreaniError('') }}/>{andreaniError && <p style={{ color: '#b42318' }}>{andreaniError}</p>}<p style={{ fontSize: 13, color: '#6f6570' }}>El seguimiento público de Andreani está disponible; la emisión/descarga automática de etiquetas requiere las credenciales y contrato API del negocio.</p></div></article>

          <article style={{ padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}><h2>📮 Correo Argentino</h2><p>Cada negocio conecta su propio acuerdo PAQ.AR y API-Key.</p><strong>{statusLabel(shippingStatus.correoargentino)}</strong><div style={{ display: 'grid', gap: 8, marginTop: 12 }}><input type="text" placeholder="Agreement" value={credentials.correoargentino.agreement} onChange={e => setCredentials(c => ({ ...c, correoargentino: { ...c.correoargentino, agreement: e.target.value } }))}/><input type="password" placeholder="API-Key" value={credentials.correoargentino.apiKey} onChange={e => setCredentials(c => ({ ...c, correoargentino: { ...c.correoargentino, apiKey: e.target.value } }))}/><input type="text" placeholder="sellerId (opcional)" value={credentials.correoargentino.sellerId} onChange={e => setCredentials(c => ({ ...c, correoargentino: { ...c.correoargentino, sellerId: e.target.value } }))}/><button onClick={() => saveShipping('correoargentino')} disabled={connecting === 'correoargentino'}>{connecting === 'correoargentino' ? 'Guardando…' : 'Conectar cuenta de este negocio'}</button><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input type="text" placeholder="Tracking Number" value={correoTracking} onChange={e => setCorreoTracking(e.target.value)}/><button onClick={async () => { setCorreoError(''); setCorreoLabelData(null); const token = await authToken(); if (!token) { setCorreoError('Iniciá sesión.'); return } const response = await fetch(`/api/correoargentino/tracking?trackingNumbers=${encodeURIComponent(correoTracking)}`, { headers: { Authorization: `Bearer ${token}` } }); const body = await response.json().catch(() => ({})); if (!response.ok) { setCorreoError(body.error || 'No se pudo consultar el seguimiento.'); return } setCorreoLabelData(body) }}>Ver estado</button><button onClick={async () => { setCorreoError(''); const token = await authToken(); if (!token) { setCorreoError('Iniciá sesión.'); return } const response = await fetch('/api/correoargentino/label', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ orders: [{ sellerId: credentials.correoargentino.sellerId, trackingNumber: correoTracking }], labelFormat: '10x15' }) }); const body = await response.json().catch(() => ({})); if (!response.ok) { setCorreoError(body.error || 'No se pudo obtener la etiqueta.'); return } setCorreoLabelData(body) }}>Etiqueta</button></div>{correoError && <p style={{ color: '#b42318' }}>{correoError}</p>}{correoLabelData && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fafafa', padding: 10, borderRadius: 10 }}>{JSON.stringify(correoLabelData, null, 2)}</pre>}<p style={{ fontSize: 13, color: '#6f6570' }}>PAQ.AR permite consultar historial y obtener rótulos/etiquetas mediante API con Agreement + API-Key propios del cliente.</p></div></article>
        </section>
      </div>
    </main>
  )
}
