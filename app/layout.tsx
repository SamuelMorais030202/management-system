import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ReactQueryProvider } from '@/lib/react-query-provider'

export const metadata: Metadata = {
  title: {
    default: 'Unisystem Tecnologia',
    template: 'Unisystem Tecnologia — %s',
  },
  description: 'Plataforma KDS e operações de cozinha da Unisystem Tecnologia.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ReactQueryProvider>
          {children}
          <Analytics />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
