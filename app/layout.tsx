import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CASA ALLEGRA · E-commerce',
  description: 'Tienda online y gestión comercial profesional.',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>
}
