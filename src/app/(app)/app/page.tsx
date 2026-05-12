import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const MODULES = [
  { emoji: '💰', label: 'Budget IA', href: '/app/budget', available: true },
  { emoji: '🎁', label: 'Ndawtal', href: '/app/ndawtal', available: true },
  { emoji: '📋', label: 'Planning', href: '/app/planning', available: false },
  { emoji: '🏪', label: 'Prestataires', href: '/app/prestataires', available: false },
  { emoji: '👥', label: 'Invités', href: '/app/invites', available: false },
  { emoji: '👗', label: 'Tenues', href: '/app/tenues', available: false },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  return (
    <div className="min-h-screen" style={{ background: '#f8f6f2' }}>
      <header className="px-6 py-4 border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
            SamaMariage
          </h1>
          <span className="text-sm text-gray-400">{user.email ?? user.phone}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
          Mon tableau de bord 🎉
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Organise ton mariage étape par étape</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {MODULES.map(m => (
            m.available ? (
              <Link key={m.label} href={m.href}
                className="bg-white rounded-xl p-5 border border-green-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all group">
                <div className="text-3xl mb-3">{m.emoji}</div>
                <div className="font-semibold group-hover:text-green-700 transition-colors">{m.label}</div>
                <div className="text-xs text-green-600 mt-1 font-medium">Disponible →</div>
              </Link>
            ) : (
              <div key={m.label}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm opacity-50 cursor-default">
                <div className="text-3xl mb-3">{m.emoji}</div>
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-gray-400 mt-1">Bientôt disponible</div>
              </div>
            )
          ))}
        </div>
      </main>
    </div>
  )
}
