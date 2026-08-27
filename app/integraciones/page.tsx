'use client'

import { useState } from 'react'

const integrations = [
  { icon: '💳', name: 'Mercado Pago', type: 'Pagos', text: 'Preparado para pagos online, links de pago, referencias y estados de cobro.' },
  { icon: '🛒', name: 'Mercado Libre', type: 'Marketplace', text: 'Preparado para publicaciones, SKU, ventas, compradores y pedidos.' },
  { icon: '📦', name: 'Mercado Envíos', type: 'Envíos', text: 'Preparado para shipment, tracking, estados y costos de envío.' },
  { icon: '📮', name: 'Correo Argentino', type: 'Correo', text: 'Preparado para despacho, seguimiento, estado, costo y entrega.' },
  { icon: '🚚', name: 'Andreani', type: 'Logística', text: 'Preparado para despacho, tracking, estado de entrega y costo.' },
]

export default function IntegracionesPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#fffaf7', color: '#3c3441' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: 20, textDecoration: 'none', color: '#3c3441', fontWeight: 700 }}>
          ← Volver a CASA ALLEGRA
        </a>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>CASA ALLEGRA APP</div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 36 }}>🔗 Integraciones</h1>
          <p style={{ margin: 0, color: '#7d7381' }}>Centro de pagos, marketplace y logística. Las conexiones reales por API se habilitarán en la segunda etapa.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
          {integrations.map((item) => (
            <article key={item.name} style={{ background: '#fff', border: '1px solid #eee4ef', borderRadius: 20, padding: 20, boxShadow: '0 15px 45px rgba(67,43,88,.09)', minHeight: 230, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34 }}>{item.icon}</div>
              <span style={{ display: 'inline-flex', alignSelf: 'flex-start', marginTop: 10, padding: '5px 8px', borderRadius: 999, background: '#eaf8f7', color: '#337d80', fontSize: 10, fontWeight: 800 }}>{item.type}</span>
              <h2 style={{ margin: '10px 0 8px', fontSize: 20 }}>{item.name}</h2>
              <p style={{ margin: 0, color: '#7d7381', lineHeight: 1.5, fontSize: 13 }}>{item.text}</p>
              <button type="button" onClick={() => setSelected(item.name)} style={{ marginTop: 'auto', border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                Configurar
              </button>
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
        {selected && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(49,38,61,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div style={{ width: 'min(520px,100%)', background: '#fff', borderRadius: 20, padding: 22 }}>
              <button type="button" onClick={() => setSelected(null)} style={{ float: 'right', border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 800, color: '#36aeb2' }}>INTEGRACIÓN</div>
              <h2 style={{ margin: '6px 0 8px' }}>Configurar {selected}</h2>
              <p style={{ color: '#7d7381' }}>Interfaz preparada. En la segunda etapa conectaremos las credenciales y APIs oficiales.</p>
              <button type="button" onClick={() => setSelected(null)} style={{ border: 0, borderRadius: 13, padding: '11px 14px', background: '#63c7c9', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
