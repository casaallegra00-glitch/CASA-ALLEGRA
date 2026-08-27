'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Provider = 'mercadopago' | 'mercadolibre'
type Status = 'checking' | 'connected' | 'disconnected'

type Card = { icon: string; name: string; kind: string; description: string; provider?: Provider; note?: string }

const cards: Card[] = [
  { icon: '💳', name: 'Mercado Pago', kind: 'Pagos', description: 'Cada usuario autoriza su propia cuenta para cobrar con Checkout Pro.', provider: 'mercadopago' },
  { icon: '🛒', name: 'Mercado Libre', kind: 'Marketplace', description: 'Cada usuario autoriza su propia cuenta para publicaciones, ventas y compradores.', provider: 'mercadolibre' },
  { icon: '📦', name: 'Mercado Envíos', kind: 'Envíos', description: 'Se habilita con la cuenta de Mercado Libre conectada y permite trabajar sobre sus envíos.', note: 'Vinculado a Mercado Libre' },
  { icon: '📮', name: 'Correo Argentino', kind: 'Correo', description: 'Estructura preparada para credenciales/API de cada negocio.', note: 'Requiere alta/credenciales del proveedor' },
  { icon: '🚚', name: 'Andreani', kind: 'Logística', description: 'Estructura preparada para credenciales/API de cada negocio.', note: 'Requiere alta/credenciales del proveedor' },
]

export default function IntegracionesPage() {
  const [status, setStatus] = useState<Record<Provider, Status>>({ mercadopago: 'checking', mercadolibre: 'checking' })
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('1000')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const session = await supabase?.auth.getSession()
      if (!active) return
      const accessToken = session?.data.session?.access_token || ''
      setLoggedIn(Boolean(accessToken))
      const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      const [mp, ml] = await Promise.all([
        fetch('/api/integraciones/mercadopago/status', { cache: 'no-store', headers: authHeaders }).then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/integraciones/mercadolibre/status', { cache: 'no-store', headers: authHeaders }).then(r => r.json()).catch(() => ({ connected: false })),
      ])
      if (!active) return
      setStatus({ mercadopago: mp.connected ? 'connected' : 'disconnected', mercadolibre: ml.connected ? 'connected' : 'disconnected' })
      const params = new URLSearchParams(window.location.search)
      if (params.get('oauth')) setMessage(`${params.get('oauth') === 'mercadopago' ? 'Mercado Pago' : 'Mercado Libre'} quedó conectado a tu cuenta de CASA ALLEGRA.`)
      if (params.get('oauth_error')) setMessage(`No se pudo conectar ${params.get('oauth_error') === 'mercadopago' ? 'Mercado Pago' : 'Mercado Libre'}: ${params.get('reason') || 'error de autorización'}.`)
    }
    load()
    return () => { active = false }
  }, [])

  const connect = async (provider: Provider) => {
    setMessage('')
    if (!supabase) { setMessage('La cuenta de CASA ALLEGRA no está configurada.'); return }
    const { data } = await supabase.auth.getSession()
    if (!data.session) { setMessage('Primero iniciá sesión en CASA ALLEGRA.'); return }
    const response = await fetch(`/api/integraciones/${provider}/start`, { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok || !body.url) { setMessage(body.error || 'No se pudo iniciar la conexión.'); return }
    window.location.href = body.url
  }

  const createCheckout = async () => {
    setCheckoutError(''); setCheckoutUrl('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) { setCheckoutError('Ingresá un importe válido.'); return }
    const session = await supabase?.auth.getSession()
    const accessToken = session?.data.session?.access_token
    if (!accessToken) { setCheckoutError('Iniciá sesión en CASA ALLEGRA antes de crear un checkout.'); return }
    const response = await fetch('/api/mercadopago/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title: 'Prueba CASA ALLEGRA', quantity: 1, unit_price: value }) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) { setCheckoutError(body.error || 'No se pudo crear el checkout.'); return }
    const url = body.init_point || body.sandbox_init_point
    if (!url) { setCheckoutError('Mercado Pago no devolvió el enlace.'); return }
    setCheckoutUrl(url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const statusLabel = (provider: Provider) => status[provider] === 'checking' ? '○ Comprobando…' : status[provider] === 'connected' ? '● Conectado' : '○ Sin conectar'

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: 20, textDecoration: 'none', color: '#3c3441', fontWeight: 800 }}>← Volver a CASA ALLEGRA</a>
        <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, letterSpacing: '.12em', fontWeight: 800, color: '#36aeb2' }}>CASA ALLEGRA APP</div><h1 style={{ margin: '6px 0 8px', fontSize: 36 }}>🔗 Conexiones de tu negocio</h1><p style={{ margin: 0, color: '#7d7381', lineHeight: 1.6 }}>Cada usuario conecta sus propias cuentas. CASA ALLEGRA no comparte tus cuentas con otros usuarios.</p></div>
        {!loggedIn && <div style={{ padding: 16, marginBottom: 18, borderRadius: 16, background: '#fff4e8', color: '#76583f', fontWeight: 700 }}>🔐 Iniciá sesión para conectar cuentas externas. La conexión queda asociada a tu usuario de CASA ALLEGRA.</div>}
        {message && <div style={{ padding: 14, marginBottom: 18, borderRadius: 14, background: message.startsWith('No se') || message.startsWith('Primero') ? '#fff0f0' : '#eaf8f0', color: '#4f7f64', fontWeight: 700 }}>{message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 16 }}>
          {cards.map(card => {
            const providerStatus = card.provider ? statusLabel(card.provider) : card.name === 'Mercado Envíos' && status.mercadolibre === 'connected' ? '● Disponible con Mercado Libre' : card.note || '○ Preparación'
            return <article key={card.name} style={{ background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20, minHeight: 260, boxShadow: '0 15px 45px rgba(67,43,88,.09)', display: 'flex', flexDirection: 'column' }}><div style={{ fontSize: 34 }}>{card.icon}</div><span style={{ marginTop: 10, alignSelf: 'flex-start', padding: '5px 8px', borderRadius: 999, background: '#eaf8f7', color: '#337d80', fontSize: 10, fontWeight: 800 }}>{card.kind}</span><h2 style={{ margin: '10px 0 8px', fontSize: 20 }}>{card.name}</h2><p style={{ margin: 0, color: '#7d7381', lineHeight: 1.5, fontSize: 13 }}>{card.description}</p><div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, color: providerStatus.startsWith('●') ? '#4f946f' : '#9a8f9d' }}>{providerStatus}</div>{card.provider ? <button type="button" onClick={() => connect(card.provider!)} style={{ marginTop: 'auto', border: 0, borderRadius: 13, padding: '12px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{status[card.provider] === 'connected' ? 'Administrar conexión' : 'Conectar con 1 clic'}</button> : <button type="button" onClick={() => setMessage(card.note || 'Esta conexión se implementará con las credenciales del proveedor.')} style={{ marginTop: 'auto', border: '1px solid #eee4ef', borderRadius: 13, padding: '12px 14px', background: '#fff', color: '#3c3441', fontWeight: 800, cursor: 'pointer' }}>Ver cómo conectar</button>}</article>
          })}
        </div>
        <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20 }}><h2 style={{ margin: 0 }}>💳 Checkout Pro con la cuenta del usuario</h2><p style={{ color: '#7d7381', lineHeight: 1.55 }}>Una vez conectado Mercado Pago, los cobros de este usuario se crean usando su propia autorización OAuth, no el Access Token global de CASA ALLEGRA.</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}><label style={{ fontSize: 12, fontWeight: 800 }}>Importe ARS<input value={amount} onChange={e => setAmount(e.target.value)} style={{ display: 'block', marginTop: 5, width: 150, border: '1px solid #e9dfea', borderRadius: 12, padding: '10px 12px' }} /></label><button type="button" onClick={createCheckout} disabled={status.mercadopago !== 'connected'} style={{ border: 0, borderRadius: 13, padding: '11px 14px', background: status.mercadopago === 'connected' ? '#63c7c9' : '#cfc7d1', color: '#fff', fontWeight: 800 }}>Crear checkout de prueba</button>{checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noreferrer" style={{ borderRadius: 13, padding: '11px 14px', background: '#f8f3fa', color: '#3c3441', fontWeight: 800, textDecoration: 'none' }}>Abrir Mercado Pago</a>}</div>{checkoutError && <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: '#fff0f0', color: '#a34d4d', fontSize: 12 }}>{checkoutError}</div>}</section>
        <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 18 }}><strong>🔐 Cómo funciona</strong><div style={{ marginTop: 12, display: 'grid', gap: 8, color: '#6f6673', fontSize: 13 }}><div>1. El usuario inicia sesión en CASA ALLEGRA.</div><div>2. Pulsa <b>Conectar con 1 clic</b>.</div><div>3. Mercado Pago o Mercado Libre muestra su propia pantalla de autorización.</div><div>4. El usuario acepta y vuelve automáticamente a CASA ALLEGRA.</div><div>5. La conexión queda cifrada en servidor y asociada al usuario para poder usarla desde otros dispositivos.</div></div></section>
      </div>
    </main>
  )
}
