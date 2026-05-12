import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { TrpcProvider } from '@/components/shared/TrpcProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "SamaMariage — L'IA qui organise ton mariage sénégalais",
    template: '%s | SamaMariage',
  },
  description: 'Budget, prestataires, ndawtal, tenues : tout en un. Made in Dakar.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  )
}
