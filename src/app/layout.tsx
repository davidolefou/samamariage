import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { TrpcProvider } from '@/components/shared/TrpcProvider'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], style: ['normal', 'italic'] })
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'], weight: ['400', '500'] })

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
    <html lang="fr" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  )
}
