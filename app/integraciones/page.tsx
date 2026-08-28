'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Provider = 'mercadopago' | 'mercadolibre'
type Status = 'checking' | 'connected' | 'disconnected'
type Payment = {
  id: string | number | null
  createdAt: string | null
  approvedAt: string | null
  status: string | null
  currency: string
  amount: number
  netAmount: number | null
  description: string | null
  paymentMethod: string | null
  paymentType: string | null
  externalReference: string | null
  payer: {
    id: string | number | null
    email: string | null
    firstName: string | null
    lastName: string | null
    identification: { type?: string | null; number?: string | null } | null
    phone: { area_code?: string | null; number?: string | null } | null
  }
}

type Card = { icon: string; name: string; kind: string; description: string; provider?: Provider; note?: string }

const cards: Card[] = [
  { icon: '💳', name: 'Mercado Pago', kind: 'Cobros recibidos', description: 'Cada negocio conecta su propia cuenta para consultar sus cobros recibidos y los datos que Mercado Pago expone del pagador.', provider: 'mercadopago' },
  { icon: '🛒', name: 'Mercado Libre', kind: 'Marketplace', description: 'Cada negocio autoriza su propia cuenta para publicaciones, ventas y compradores.', provider: 'mercadolibre' },
  { icon: '📦', name: 'Mercado Envíos', kind: 'Envíos', description: 'Se habilita con la cuenta de Mercado Libre conectada y permite trabajar sobre sus envíos.', note: 'Vinculado a Mercado Libre' },
  { icon: '📮', name: 'Correo Argentino', kind: 'Correo', description: 'Estructura preparada para credenciales/API de cada negocio.', note: 'Requiere alta/credenciales del proveedor' },
  { icon: '🚚', name: 'Andreani', kind: 'Logística', description: 'Estructura preparada para credenciales/API de cada negocio.', note: 'Requiere alta/credenciales del proveedor' },
]

const money = (amount: number, currency = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
const payerName = (payment: Payment) => [payment.payer.firstName, payment.payer.lastName].filter(Boolean).join(' ') || 'Pagador no informado'
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('es-AR') : '—'

export default function IntegracionesPage() {
  const [status, setStatus] = useState<Record<Provider, Status>>({ mercadopago: 'checking', mercadolibre: 'checking' })
  const [message, setMessage] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [connecting, setConnecting] = useState<Provider | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsError, setPaymentsError] = useState('')
  const [loadingPayments, setLoadingPayments] = useState(false)

  const loadPayments = async () => {
    setPaymentsError('')
    setLoadingPayments(true)
    try {
      const session = await supabase?.auth.getSession()
      const accessToken = session?.data.session?.access_token
      if (!accessToken) throw new Error('Iniciá sesión en CASA ALLEGRA para consultar los cobros.')
      const response = await fetch('/api/mercadopago/received', { cache: 'no-store', headers: { Authorization: `Bearer ${accessToken}` } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `El servidor respondió ${response.status}.`)
      setPayments(Array.isArray(body.payments) ? body.payments : [])
    } catch (error) {
      setPaymentsError(error instanceof Error ? error.message : 'No se pudieron consultar los cobros recibidos.')
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!supabase) { setLoggedIn(false); setStatus({ mercadopago: 'disconnected', mercadolibre: 'disconnected' }); return }
      const { data } = await supabase.auth.getSession()
      if (!active) return
      const accessToken = data.session?.access_token || ''
      setLoggedIn(Boolean(accessToken))
      const authHeaders: Record<string, string> = {}
      if (accessToken) authHeaders.Authorization = `Bearer ${accessToken}`
      const [mp, ml] = await Promise.all([
        fetch('/api/integraciones/mercadopago/status', { cache: 'no-store', headers: authHeaders }).then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/integraciones/mercadolibre/status', { cache: 'no-store', headers: authHeaders }).then(r => r.json()).catch(() => ({ connected: false })),
      ])
      if (!active) return
      setStatus({ mercadopago: mp.connected ? 'connected' : 'disconnected', mercadolibre: ml.connected ? 'connected' : 'disconnected' })
      const params = new URLSearchParams(window.location.search)
      if (params.get('oauth')) setMessage(`${params.get('oauth') === 'mercadopago' ? 'Mercado Pago' : 'Mercado Libre'} quedó conectado a tu cuenta de CASA ALLEGRA.`)
      if (params.get('oauth_error')) setMessage(`No se pudo conectar ${params.get('oauth_error') === 'mercadopago' ? 'Mercado Pago' : 'Mercado Libre'}: ${params.get('reason') || 'error de autorización'}.`)
      if (accessToken && mp.connected) await loadPayments()
    }
    load()
    return () => { active = false }
  }, [])

  const connect = async (provider: Provider) => {
    if (connecting || disconnecting) return
    setMessage('')
    setConnecting(provider)
    try {
      if (!supabase) throw new Error('Supabase no está configurado en este entorno.')
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error(`No se pudo obtener la sesión: ${sessionError.message}`)
      if (!data.session?.access_token) throw new Error('No hay una sesión activa. Cerrá sesión, volvé a ingresar y probá nuevamente.')
      const response = await fetch(`/api/integraciones/${provider}/start`, { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `El servidor respondió ${response.status}.`)
      if (!body.url || typeof body.url !== 'string') throw new Error('El servidor no devolvió la URL de autorización.')
      window.location.href = body.url
    } catch (error) {
      setConnecting(null)
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar la conexión.')
    }
  }

  const disconnectMercadoPago = async () => {
    if (disconnecting || connecting) return
    setDisconnecting(true)
    try {
      const session = await supabase?.auth.getSession()
      const accessToken = session?.data.session?.access_token
      if (!accessToken) throw new Error('Iniciá sesión en CASA ALLEGRA para desconectar Mercado Pago.')
      const response = await fetch('/api/integraciones/mercadopago/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `El servidor respondió ${response.status}.`)
      setStatus(current => ({ ...current, mercadopago: 'disconnected' }))
      setPayments([])
      setMessage('La cuenta de Mercado Pago fue desconectada de este negocio de CASA ALLEGRA.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo desconectar Mercado Pago.')
    } finally {
      setDisconnecting(false)
    }
  }

  const totalReceived = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments])

  const statusLabel = (provider: Provider) => status[provider] === 'checking' ? '○ Comprobando…' : status[provider] === 'connected' ? '● Cuenta conectada' : '○ Sin conectar'

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Integraciones</h1>
        <p style={{ color: '#6f6570' }}>Mercado Pago funciona como conexión de cobros del negocio. CASA ALLEGRA no crea pagos ni recibe dinero en una cuenta propia.</p>
        {!loggedIn && <p style={{ padding: 12, background: '#fff0d9', borderRadius: 10 }}>Iniciá sesión para conectar servicios.</p>}
        {message && <p style={{ padding: 12, background: '#eaf8ed', borderRadius: 10 }}>{message}</p>}

        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', marginTop: 24 }}>
          {cards.map(card => <article key={card.name} style={{ padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
            <div style={{ fontSize: 28 }}>{card.icon}</div><h2 style={{ margin: '8px 0' }}>{card.name}</h2><small>{card.kind}</small><p>{card.description}</p>
            {card.provider ? <><strong>{statusLabel(card.provider)}</strong><div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" onClick={() => connect(card.provider!)} disabled={connecting !== null || disconnecting || status[card.provider!] === 'checking'}>{connecting === card.provider ? 'Conectando…' : status[card.provider!] === 'connected' ? 'Cambiar cuenta' : 'Conectar cuenta del negocio'}</button>{card.provider === 'mercadopago' && status.mercadopago === 'connected' && <button type="button" onClick={disconnectMercadoPago} disabled={disconnecting || connecting !== null}>{disconnecting ? 'Desconectando…' : 'Desconectar'}</button>}</div></> : <p><small>{card.note}</small></p>}
          </article>)}
        </section>

        {status.mercadopago === 'connected' && <section style={{ marginTop: 28, padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><h2 style={{ margin: 0 }}>Cobros recibidos</h2><p style={{ margin: '6px 0', color: '#6f6570' }}>Pagos aprobados de los últimos 30 días asociados a la cuenta de este negocio.</p></div>
            <button type="button" onClick={loadPayments} disabled={loadingPayments}>{loadingPayments ? 'Actualizando…' : 'Actualizar cobros'}</button>
          </div>

          {paymentsError && <p style={{ padding: 12, background: '#fff0f0', color: '#b42318', borderRadius: 10 }}>{paymentsError}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '18px 0' }}>
            <div style={{ padding: 16, background: '#f6fbf7', borderRadius: 14 }}><small>Total recibido visible</small><div style={{ fontSize: 26, fontWeight: 800 }}>{money(totalReceived)}</div></div>
            <div style={{ padding: 16, background: '#faf7ff', borderRadius: 14 }}><small>Operaciones aprobadas</small><div style={{ fontSize: 26, fontWeight: 800 }}>{payments.length}</div></div>
            <div style={{ padding: 16, background: '#fffaf0', borderRadius: 14 }}><small>Período</small><div style={{ fontSize: 20, fontWeight: 700 }}>Últimos 30 días</div></div>
          </div>

          {payments.length === 0 && !loadingPayments ? <p style={{ color: '#6f6570' }}>No encontramos cobros aprobados en el período consultado.</p> : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr>{['Fecha','Pagador','Importe','Medio','Estado'].map(head => <th key={head} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eadfe0' }}>{head}</th>)}</tr></thead>
              <tbody>{payments.map(payment => <tr key={String(payment.id)}>
                <td style={{ padding: 10, borderBottom: '1px solid #f0e9ea' }}>{formatDate(payment.approvedAt || payment.createdAt)}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0e9ea' }}><strong>{payerName(payment)}</strong><br/><small>{payment.payer.email || 'Email no informado'}</small></td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0e9ea' }}><strong>{money(payment.amount, payment.currency)}</strong>{payment.netAmount != null && <><br/><small>Neto: {money(payment.netAmount, payment.currency)}</small></>}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0e9ea' }}>{payment.paymentMethod || payment.paymentType || 'Mercado Pago'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #f0e9ea' }}>{payment.status || 'approved'}</td>
              </tr>)}</tbody>
            </table>
          </div>}

          <p style={{ marginTop: 18, color: '#6f6570', fontSize: 13 }}>Importante: Mercado Pago expone datos del pagador en los recursos de pago cuando están disponibles. Las transferencias directas de saldo/alias no necesariamente aparecen como un pago de Checkout y pueden requerir los reportes de movimientos de Mercado Pago.</p>
        </section>}
      </div>
    </main>
  )
}
