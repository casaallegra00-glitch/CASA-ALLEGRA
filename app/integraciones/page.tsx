'use client'

import { useEffect, useState } from 'react'

type Integration = { icon: string; name: string; type: string; text: string; fields: string[] }

const integrations: Integration[] = [
  { icon: '💳', name: 'Mercado Pago', type: 'Pagos', text: 'Checkout Pro, preferencias, estados de cobro y Webhooks desde el servidor.', fields: ['Access Token', 'Public Key'] },
  { icon: '🛒', name: 'Mercado Libre', type: 'Marketplace', text: 'Preparado para publicaciones, SKU, ventas, compradores y pedidos.', fields: ['Client ID', 'Client Secret'] },
  { icon: '📦', name: 'Mercado Envíos', type: 'Envíos', text: 'Preparado para shipment, tracking, estados y costos de envío.', fields: ['Cuenta / Seller ID'] },
  { icon: '📮', name: 'Correo Argentino', type: 'Correo', text: 'Preparado para despacho, seguimiento, estado, costo y entrega.', fields: ['Usuario / Cuenta', 'API Key'] },
  { icon: '🚚', name: 'Andreani', type: 'Logística', text: 'Preparado para despacho, tracking, estado de entrega y costo.', fields: ['API Key', 'Cuenta'] },
]

export default function IntegracionesPage() {
  const [selected, setSelected] = useState<Integration | null>(null)
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState('')
  const [mpStatus, setMpStatus] = useState<'checking' | 'connected' | 'not-configured' | 'invalid'>('checking')
  const [mpMessage, setMpMessage] = useState('Comprobando conexión segura…')
  const [amount, setAmount] = useState('1000')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('casa-allegra-integrations')
      if (raw) setConnected(JSON.parse(raw))
    } catch {}
    fetch('/api/mercadopago/health', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (data.connected) { setMpStatus('connected'); setMpMessage(`Conectado${data.nickname ? ` · ${data.nickname}` : ''}`) }
        else if (!data.configured) { setMpStatus('not-configured'); setMpMessage('Falta configurar el secreto de Mercado Pago en Vercel.') }
        else { setMpStatus('invalid'); setMpMessage(data.message || 'No se pudo validar el Access Token.') }
      })
      .catch(() => { setMpStatus('invalid'); setMpMessage('No se pudo consultar el estado de Mercado Pago.') })
  }, [])

  const configure = (item: Integration) => {
    setSaved('')
    setValues(Object.fromEntries(item.fields.map((field) => [field, ''])))
    setSelected(item)
  }

  const saveConnection = () => {
    if (!selected) return
    const next = { ...connected, [selected.name]: true }
    setConnected(next)
    try { localStorage.setItem('casa-allegra-integrations', JSON.stringify(next)) } catch {}
    setSaved(`${selected.name} quedó preparada para conectar.`)
  }

  const createTestCheckout = async () => {
    setCheckoutError(''); setCheckoutUrl('')
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setCheckoutError('Ingresá un importe válido mayor que 0.'); return }
    try {
      const response = await fetch('/api/mercadopago/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Prueba CASA ALLEGRA', quantity: 1, unit_price: numericAmount }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) { setCheckoutError(data.error || 'No se pudo crear el checkout.'); return }
      const url = data.init_point || data.sandbox_init_point || ''
      if (!url) { setCheckoutError('Mercado Pago no devolvió una URL de checkout.'); return }
      setCheckoutUrl(url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch { setCheckoutError('No se pudo contactar al servidor de CASA ALLEGRA.') }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: 20, textDecoration: 'none', color: '#3c3441', fontWeight: 700 }}>← Volver a CASA ALLEGRA</a>
        <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>CASA ALLEGRA APP</div><h1 style={{ margin: '6px 0 8px', fontSize: 36 }}>🔗 Integraciones</h1><p style={{ margin: 0, color: '#7d7381' }}>Centro de pagos, marketplace y logística. Las claves privadas se utilizan únicamente en el servidor de Vercel.</p></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
          {integrations.map((item) => (
            <article key={item.name} style={{ background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20, boxShadow: '0 15px 45px rgba(67,43,88,.09)', minHeight: 245, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34 }}>{item.icon}</div><span style={{ display: 'inline-flex', alignSelf: 'flex-start', marginTop: 10, padding: '5px 8px', borderRadius: 999, background: '#eaf8f7', color: '#337d80', fontSize: 10, fontWeight: 800 }}>{item.type}</span><h2 style={{ margin: '10px 0 8px', fontSize: 20 }}>{item.name}</h2><p style={{ margin: 0, color: '#7d7381', lineHeight: 1.5, fontSize: 13 }}>{item.text}</p>
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: item.name === 'Mercado Pago' ? (mpStatus === 'connected' ? '#4f946f' : '#9a8f9d') : (connected[item.name] ? '#4f946f' : '#9a8f9d') }}>{item.name === 'Mercado Pago' ? (mpStatus === 'connected' ? '● Conectado' : mpStatus === 'checking' ? '○ Comprobando…' : '○ Sin conectar') : (connected[item.name] ? '● Preparada' : '○ Sin configurar')}</div>
              <button type="button" onClick={() => configure(item)} style={{ marginTop: 'auto', border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{item.name === 'Mercado Pago' ? 'Ver conexión y checkout' : 'Configurar'}</button>
            </article>
          ))}
        </div>

        <section id="mercadopago-checkout" style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20 }}>
          <strong>💳 Mercado Pago · Checkout Pro</strong><p style={{ margin: '8px 0 14px', color: '#7d7381', fontSize: 13 }}>{mpMessage}</p>
          <div style={{ padding: 14, borderRadius: 14, background: '#f8f3fa', marginBottom: 14, fontSize: 12, lineHeight: 1.55 }}><b>🧪 Prueba correcta:</b> el vendedor usa las credenciales de prueba cargadas en Vercel y el comprador debe ser una <b>cuenta de prueba de comprador de Mercado Pago</b>. Abrí el checkout en una ventana de incógnito e iniciá sesión allí con ese comprador. <b>No uses tu cuenta personal.</b></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><label style={{ fontSize: 12, fontWeight: 800 }}>Importe ARS<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" style={{ display: 'block', marginTop: 5, width: 150, border: '1px solid #e9dfea', borderRadius: 12, padding: '10px 12px' }} /></label><button type="button" onClick={createTestCheckout} disabled={mpStatus !== 'connected'} style={{ marginTop: 17, border: 0, borderRadius: 13, padding: '11px 14px', background: mpStatus === 'connected' ? '#63c7c9' : '#cfc7d1', color: '#fff', fontWeight: 800, cursor: mpStatus === 'connected' ? 'pointer' : 'not-allowed' }}>Crear checkout de prueba</button>{checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noreferrer" style={{ marginTop: 17, borderRadius: 13, padding: '11px 14px', background: '#f8f3fa', color: '#3c3441', fontWeight: 800, textDecoration: 'none' }}>Abrir Mercado Pago</a>}</div>
          {checkoutError && <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: '#fff0f0', color: '#a34d4d', fontSize: 12 }}>{checkoutError}</div>}
        </section>

        <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 18 }}><strong>Flujo preparado</strong><div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{['🧾 Presupuesto', '💳 Pago', '📦 Pedido', '🚚 Envío', '✅ Entrega'].map((step, index) => <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ padding: '9px 11px', background: '#f8f3fa', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{step}</span>{index < 4 && <b>→</b>}</span>)}</div></section>

        {selected && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(49,38,61,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 10000 }}><div style={{ width: 'min(560px,100%)', background: '#fff', borderRadius: 20, padding: 22 }}>
          <button type="button" onClick={() => setSelected(null)} style={{ float: 'right', border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button><div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>INTEGRACIÓN</div><h2 style={{ margin: '6px 0 8px' }}>{selected.icon} {selected.name}</h2>
          {selected.name === 'Mercado Pago' ? <><div style={{ padding: 14, borderRadius: 14, background: mpStatus === 'connected' ? '#eaf8f0' : '#fff4e8', color: mpStatus === 'connected' ? '#4f7f64' : '#8a6748', fontWeight: 800 }}>{mpStatus === 'connected' ? '● Mercado Pago conectado correctamente' : `○ ${mpMessage}`}</div><p style={{ color: '#7d7381', fontSize: 13, lineHeight: 1.5 }}>El Access Token se mantiene como secreto en Vercel. Para probar Checkout Pro, Mercado Pago exige separar vendedor y comprador: el vendedor usa las credenciales de prueba de la integración y el comprador debe ser un usuario de prueba distinto.</p><button type="button" onClick={() => { setSelected(null); document.getElementById('mercadopago-checkout')?.scrollIntoView({ behavior: 'smooth' }) }} style={{ border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Ir al Checkout Pro</button></> : <><p style={{ color: '#7d7381', fontSize: 13 }}>Esta integración todavía está en estructura segura. Los datos no se guardan como credenciales reales en el navegador.</p><div style={{ display: 'grid', gap: 10, marginTop: 16 }}>{selected.fields.map((field) => <label key={field} style={{ display: 'grid', gap: 6, fontSize: 11, fontWeight: 800 }}>{field}<input value={values[field] || ''} onChange={(e) => setValues((current) => ({ ...current, [field]: e.target.value }))} placeholder="Preparado para conexión segura" style={{ border: '1px solid #e9dfea', borderRadius: 12, padding: '10px 12px' }} /></label>)}</div>{saved && <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: '#eaf8f0', color: '#4f7f64', fontSize: 12 }}>{saved}</div>}<button type="button" onClick={saveConnection} style={{ marginTop: 18, border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Guardar estructura</button></>}
          <button type="button" onClick={() => setSelected(null)} style={{ marginLeft: 8, border: '1px solid #eee4ef', borderRadius: 13, padding: '11px 14px', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cerrar</button>
        </div></div>}
      </div>
    </main>
  )
}
