'use client'

import { useEffect, useState } from 'react'

type Integration = { icon: string; name: string; type: string; text: string; fields: string[] }

const integrations: Integration[] = [
  { icon: '💳', name: 'Mercado Pago', type: 'Pagos', text: 'Preparado para pagos online, links de pago, referencias y estados de cobro.', fields: ['Access Token', 'Public Key'] },
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('casa-allegra-integrations')
      if (raw) setConnected(JSON.parse(raw))
    } catch {}
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

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: 20, textDecoration: 'none', color: '#3c3441', fontWeight: 700 }}>← Volver a CASA ALLEGRA</a>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>CASA ALLEGRA APP</div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 36 }}>🔗 Integraciones</h1>
          <p style={{ margin: 0, color: '#7d7381' }}>Centro de pagos, marketplace y logística. La interfaz y estructura están listas; las credenciales reales se conectarán mediante variables seguras de Vercel.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
          {integrations.map((item) => (
            <article key={item.name} style={{ background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20, boxShadow: '0 15px 45px rgba(67,43,88,.09)', minHeight: 245, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34 }}>{item.icon}</div>
              <span style={{ display: 'inline-flex', alignSelf: 'flex-start', marginTop: 10, padding: '5px 8px', borderRadius: 999, background: '#eaf8f7', color: '#337d80', fontSize: 10, fontWeight: 800 }}>{item.type}</span>
              <h2 style={{ margin: '10px 0 8px', fontSize: 20 }}>{item.name}</h2>
              <p style={{ margin: 0, color: '#7d7381', lineHeight: 1.5, fontSize: 13 }}>{item.text}</p>
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: connected[item.name] ? '#4f946f' : '#9a8f9d' }}>{connected[item.name] ? '● Preparada' : '○ Sin configurar'}</div>
              <button type="button" onClick={() => configure(item)} style={{ marginTop: 'auto', border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Configurar</button>
            </article>
          ))}
        </div>

        <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 18 }}>
          <strong>Flujo preparado</strong>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['🧾 Presupuesto', '💳 Pago', '📦 Pedido', '🚚 Envío', '✅ Entrega'].map((step, index) => (
              <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ padding: '9px 11px', background: '#f8f3fa', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{step}</span>{index < 4 && <b>→</b>}</span>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 18 }}>
          <strong>Arquitectura de conexión</strong>
          <p style={{ margin: '8px 0 0', color: '#7d7381', fontSize: 13, lineHeight: 1.6 }}>Las claves reales no se guardarán en el navegador. La próxima etapa utilizará rutas API del servidor y variables privadas de Vercel para mantener las credenciales protegidas.</p>
        </section>

        {selected && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(49,38,61,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 10000 }}>
            <div style={{ width: 'min(560px,100%)', background: '#fff', borderRadius: 20, padding: 22 }}>
              <button type="button" onClick={() => setSelected(null)} style={{ float: 'right', border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>INTEGRACIÓN</div>
              <h2 style={{ margin: '6px 0 8px' }}>{selected.icon} {selected.name}</h2>
              <p style={{ color: '#7d7381', fontSize: 13 }}>Estos campos son la estructura de configuración. Todavía no almacenan ni envían credenciales reales.</p>
              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                {selected.fields.map((field) => (
                  <label key={field} style={{ display: 'grid', gap: 6, fontSize: 11, fontWeight: 800 }}>
                    {field}
                    <input value={values[field] || ''} onChange={(e) => setValues((current) => ({ ...current, [field]: e.target.value }))} placeholder="Preparado para conexión segura" style={{ border: '1px solid #e9dfea', borderRadius: 12, padding: '10px 12px', outline: 'none' }} />
                  </label>
                ))}
              </div>
              {saved && <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: '#eaf8f0', color: '#4f7f64', fontSize: 12 }}>{saved}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" onClick={() => setSelected(null)} style={{ border: '1px solid #eee4ef', borderRadius: 13, padding: '11px 14px', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cerrar</button>
                <button type="button" onClick={saveConnection} style={{ border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Guardar estructura</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
