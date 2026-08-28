import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CASA ALLEGRA APP',
  description: 'Gestión de negocios simple, ordenada y profesional.',
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
        {children}
      </body>
    </html>
  )
}
