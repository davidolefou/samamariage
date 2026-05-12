import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  return (
    <div className="min-h-screen" style={{ background: '#f8f6f2' }}>
      <header className="px-6 py-4 border-b bg-white shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
            SamaMariage
          </h1>
          <span className="text-sm text-gray-500">{user.email || user.phone}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
          Bienvenue sur SamaMariage 🎉
        </h2>
        <p className="text-gray-500 mb-8">Ton espace d&apos;organisation est prêt. Voici les modules disponibles bientôt.</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { emoji: '💰', label: 'Budget IA', desc: 'Sprint 4', soon: true },
            { emoji: '🎁', label: 'Ndawtal', desc: 'Sprint 5', soon: true },
            { emoji: '📋', label: 'Planning', desc: 'Sprint 6', soon: true },
            { emoji: '🏪', label: 'Prestataires', desc: 'Sprint 7', soon: true },
            { emoji: '👥', label: 'Invités', desc: 'Sprint 9', soon: true },
            { emoji: '👗', label: 'Tenues', desc: 'Sprint 10', soon: true },
          ].map(m => (
            <div key={m.label}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm opacity-60">
              <div className="text-3xl mb-3">{m.emoji}</div>
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-gray-400 mt-1">{m.desc} — Bientôt</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
