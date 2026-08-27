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
  const [connecting, setConnecting] = useState<Provider | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!supabase) { setLoggedIn(false); setStatus({ mercadopago: 'disconnected', mercadolibre: 'disconnected' }); return }
      const { data } = await supabase.auth.getSession()
      if (!active) return
      const accessToken = data.session?.access_token || ''
      setLoggedIn(Boolean(accessToken))
      const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
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
    if (connecting) return
    setMessage('')
    setConnecting(provider)
    try {
      if (!supabase) throw new Error('La cuenta de CASA ALLEGRA no está configurada.')
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error(`No se pudo obtener la sesión: ${sessionError.message}`)
      if (!data.session) throw new Error('Primero iniciá sesión en CASA ALLEGRA.')
      const response = await fetch(`/api/integraciones/${provider}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `El servidor respondió ${response.status}.`)
      if (!body.url || typeof body.url !== 'string') throw new Error('El servidor no devolvió la URL de autorización.')
      window.location.assign(body.url)
    } catch (error) {
      setConnecting(null)
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar la conexión.')
    }
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
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Integraciones</h1>
        <p style={{ color: '#6f6570' }}>Conectá las cuentas de cada negocio a CASA ALLEGRA.</p>
        {!loggedIn && <p style={{ padding: 12, background: '#fff0d9', borderRadius: 10 }}>Iniciá sesión para conectar servicios.</p>}
        {message && <p style={{ padding: 12, background: '#eaf8ed', borderRadius: 10 }}>{message}</p>}
        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', marginTop: 24 }}>
          {cards.map(card => <article key={card.name} style={{ padding: 22, background: '#fff', border: '1px solid #eadfe0', borderRadius: 18 }}>
            <div style={{ fontSize: 28 }}>{card.icon}</div><h2 style={{ margin: '8px 0' }}>{card.name}</h2><small>{card.kind}</small><p>{card.description}</p>
            {card.provider ? <><strong>{statusLabel(card.provider)}</strong><div style={{ marginTop: 14 }}><button onClick={() => connect(card.provider!)} disabled={!loggedIn || connecting !== null || status[card.provider!] === 'checking'}>{connecting === card.provider ? 'Conectando…' : status[card.provider!] === 'connected' ? 'Administrar' : 'Conectar con 1 clic'}</button></div></> : <p><small>{card.note}</small></p>}
            {card.provider === 'mercadopago' && status.mercadopago === 'connected' && <div style={{ marginTop: 18 }}><label>Importe de prueba ARS <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" /></label><button onClick={createCheckout} style={{ marginLeft: 8 }}>Crear checkout de prueba</button>{checkoutUrl && <p><a href={checkoutUrl} target="_blank" rel="noreferrer">Abrir Mercado Pago</a></p>}{checkoutError && <p style={{ color: '#b42318' }}>{checkoutError}</p>}</div>}
          </article>)}
        </section>
      </div>
    </main>
  )
}
