'use client'

import { useEffect } from 'react'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const key = 'casa-allegra-client-recovery-v1'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
    } catch {}
  }, [])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#faf7ff' }}>
      <section style={{ maxWidth: 520, textAlign: 'center', background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(80,50,120,.12)' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>CASA ALLEGRA</h1>
        <p style={{ color: '#666', lineHeight: 1.5 }}>Estamos recuperando la aplicación. Tus datos locales no se borran.</p>
        <button onClick={() => reset()} style={{ border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>Volver a cargar</button>
      </section>
    </main>
  )
}
