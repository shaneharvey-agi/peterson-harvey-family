import type { Metadata, Viewport } from 'next'
import './globals.css'
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Mikayla.ai',
  description: 'Your family, handled',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mikayla.ai',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
  themeColor: '#07090F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
