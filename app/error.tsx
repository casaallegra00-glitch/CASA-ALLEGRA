'use client'

import { useEffect, useState } from 'react'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [recovering, setRecovering] = useState(true)

  useEffect(() => {
    let active = true
    const recover = async () => {
      try {
        const key = 'casa-allegra-client-recovery-v2'
        const alreadyRecovered = sessionStorage.getItem(key) === '1'
        if (!alreadyRecovered) {
          sessionStorage.setItem(key, '1')
          try {
            const registrations = await navigator.serviceWorker?.getRegistrations?.()
            if (registrations) {
              await Promise.all(registrations.map((registration) => registration.unregister()))
            }
          } catch {}
          try {
            if ('caches' in window) {
              const keys = await caches.keys()
              await Promise.all(keys.map((cacheName) => caches.delete(cacheName)))
            }
          } catch {}
          const url = new URL(window.location.href)
          url.searchParams.set('ca_refresh', String(Date.now()))
          window.location.replace(url.toString())
          return
        }
      } catch {}
      if (active) setRecovering(false)
    }
    recover()
    return () => { active = false }
  }, [])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#faf7ff' }}>
      <section style={{ maxWidth: 520, textAlign: 'center', background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(80,50,120,.12)' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>CASA ALLEGRA</h1>
        {recovering ? (
          <p style={{ color: '#666', lineHeight: 1.5 }}>Actualizando CASA ALLEGRA… Tus datos locales no se borran.</p>
        ) : (
          <>
            <p style={{ color: '#666', lineHeight: 1.5 }}>CASA ALLEGRA tuvo un problema al cargar. Tus datos locales no se borran.</p>
            <button onClick={() => reset()} style={{ border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>Volver a cargar</button>
          </>
        )}
      </section>
    </main>
  )
}
