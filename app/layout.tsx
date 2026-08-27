import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CASA ALLEGRA · E-commerce',
  description: 'Tienda online y gestión comercial profesional.',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const resetKey = 'casa-allegra-zero-data-v1';
                if (localStorage.getItem(resetKey) !== 'done') {
                  localStorage.setItem('casa-allegra-products', '[]');
                  localStorage.setItem('casa-allegra-sales', '[]');
                  localStorage.setItem('casa-allegra-clients', '0');
                  localStorage.setItem('casa-allegra-orders', '0');
                  localStorage.setItem(resetKey, 'done');
                }
              } catch (_) {}
            })();`,
          }}
        />
        <a href="/integraciones" aria-label="Abrir Integraciones" style={{position:'fixed',left:18,bottom:18,zIndex:9999,display:'inline-flex',alignItems:'center',gap:8,padding:'12px 14px',borderRadius:14,background:'#ffffff',color:'#3c3441',border:'1px solid #eee4ef',boxShadow:'0 10px 28px rgba(67,43,88,.14)',textDecoration:'none',fontWeight:800,fontSize:13}}>
          🔗 Integraciones
        </a>
        {children}
      </body>
    </html>
  )
}
