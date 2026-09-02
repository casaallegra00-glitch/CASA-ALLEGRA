import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CASAALLEGRA APP',
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
                // CASA ALLEGRA: nunca borrar ni reiniciar datos locales.
                // El historial existente debe poder migrarse y sincronizarse con la nube.
                const resetKey = 'casa-allegra-zero-data-v1';
                if (!localStorage.getItem(resetKey)) localStorage.setItem(resetKey, 'preserved');
              } catch (_) {}
              const fixBrandAssets = () => {
                document.querySelectorAll('img[src="/icon-512.png"],img[src="/logo-casa-allegra.png"]').forEach((img) => {
                  img.setAttribute('src', 'https://raw.githubusercontent.com/casaallegra00-glitch/CASA-ALLEGRA/main/icon-512.png');
                });
              };
              if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixBrandAssets);
              else fixBrandAssets();
              new MutationObserver(fixBrandAssets).observe(document.documentElement, { childList: true, subtree: true });
            })();`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
