'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type Status = 'Confirmé' | 'En cours' | 'Devis' | 'À trouver'

const VENDORS: Array<{
  id: string; initials: string; name: string; category: string; price: string
  status: Status; stars: number; note: string; gradient: string; phone: string; certified?: boolean
}> = [
  { id: 'v1', initials: 'AS', name: 'Adams Sidibé', category: 'Photographe', price: '850 000 F', status: 'Confirmé', stars: 5, note: 'Mariage Diallo 2025 · livraison J+12', gradient: 'linear-gradient(135deg,#1E5631,#D4A574)', phone: '+221 77 123 45 67', certified: true },
  { id: 'v2', initials: 'LC', name: 'Le Carré', category: 'Traiteur', price: '2 640 000 F', status: 'Confirmé', stars: 5, note: '450 couverts · menu déjà validé', gradient: 'linear-gradient(135deg,#722F37,#D4A574)', phone: '+221 33 820 12 34', certified: true },
  { id: 'v3', initials: 'AD', name: 'Aida Décor', category: 'Décoration', price: 'Devis 1 200 000 F', status: 'En cours', stars: 4, note: 'Renégociation fleurs en cours', gradient: 'linear-gradient(135deg,#D4A574,#1E5631)', phone: '+221 77 456 78 90' },
  { id: 'v4', initials: 'DB', name: 'DJ Bouba', category: 'Musique & Animation', price: 'Devis à venir', status: 'Devis', stars: 4, note: 'Référence Fatou Diop 2024', gradient: 'linear-gradient(135deg,#0E2916,#722F37)', phone: '+221 76 234 56 78' },
  { id: 'v5', initials: 'KS', name: 'Khady Styliste', category: 'Coiffure & Maquillage', price: '360 000 F', status: 'À trouver', stars: 0, note: '3 artistes pour 3 cérémonies', gradient: 'linear-gradient(135deg,#B98548,#D4A574)', phone: '' },
  { id: 'v6', initials: 'MP', name: 'Mansour Print', category: 'Faire-part', price: '240 000 F', status: 'À trouver', stars: 0, note: '450 exemplaires · délai 3 semaines', gradient: 'linear-gradient(135deg,#4a9e68,#1E5631)', phone: '' },
]

const CATEGORIES = ['Tous', 'Photographe', 'Traiteur', 'Décoration', 'Musique & Animation', 'Coiffure & Maquillage', 'Faire-part']
const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  'Confirmé':  { bg: '#EAF1EC', text: '#1E5631' },
  'En cours':  { bg: '#FBF4EA', text: '#B98548' },
  'Devis':     { bg: 'rgba(114,47,55,.1)', text: '#722F37' },
  'À trouver': { bg: 'rgba(61,61,61,.07)', text: 'rgba(61,61,61,.6)' },
}

export default function PrestatairesPage() {
  const [tab, setTab]       = useState<'mes' | 'explorer'>('mes')
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')

  const confirmed = VENDORS.filter(v => v.status === 'Confirmé').length
  const filtered  = VENDORS.filter(v =>
    (filter === 'Tous' || v.category === filter) &&
    (search === '' || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      {/* Stats banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Bookés',      val: `${confirmed}/${VENDORS.length}`, color: '#1E5631' },
          { label: 'Budget resto', val: '3 490 000 F', color: '#D4A574' },
          { label: 'À confirmer', val: `${VENDORS.filter(v => v.status === 'En cours' || v.status === 'Devis').length}`, color: '#B98548' },
          { label: 'À trouver',   val: `${VENDORS.filter(v => v.status === 'À trouver').length}`, color: '#722F37' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{s.label}</div>
            <div className="font-display text-2xl" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(61,61,61,.06)' }}>
        {(['mes', 'explorer'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition"
            style={{ background: tab === t ? 'white' : 'transparent', color: tab === t ? '#0E2916' : 'rgba(61,61,61,.6)', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}
          >
            {t === 'mes' ? 'Mes bookings' : 'Explorer 500+'}
          </button>
        ))}
      </div>

      {tab === 'mes' ? (
        <>
          {/* Search + category filter */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl bg-white px-3.5 py-2.5" style={{ outline: '1px solid rgba(61,61,61,.1)' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ color: 'rgba(61,61,61,.4)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="search" placeholder="Rechercher un prestataire…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#0E2916' }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium transition"
                  style={{
                    background: filter === cat ? '#1E5631' : 'white',
                    color:      filter === cat ? '#F7E9CF' : 'rgba(61,61,61,.7)',
                    outline: filter === cat ? 'none' : '1px solid rgba(61,61,61,.12)',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>

          {/* Vendor cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(v => (
              <div key={v.id} className="dashboard-card rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg text-white" style={{ background: v.gradient }}>{v.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: '#0E2916' }}>{v.name}</span>
                      {v.certified && (
                        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="#1E5631"><circle cx="8" cy="8" r="7"/><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none"/></svg>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.55)' }}>{v.category}</div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0" style={{ background: STATUS_COLORS[v.status].bg, color: STATUS_COLORS[v.status].text }}>{v.status}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="font-display text-xl" style={{ color: '#0E2916' }}>{v.price}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(61,61,61,.55)' }}>{v.note}</div>
                  </div>
                  {v.stars > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: v.stars }).map((_, i) => (
                        <svg key={i} viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="#D4A574"><path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1-3-2.9 4.2-.8L8 1z"/></svg>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {v.phone ? (
                    <a href={`tel:${v.phone}`} className="flex-1 text-center rounded-xl py-2 text-[12px] font-medium border hover:bg-[#EAF1EC] transition" style={{ borderColor: '#1E5631', color: '#1E5631' }}>
                      📞 Appeler
                    </a>
                  ) : (
                    <button onClick={() => toast.info('Ouverture annuaire prestataires…')} className="flex-1 text-center rounded-xl py-2 text-[12px] font-medium hover:opacity-90 transition" style={{ background: '#1E5631', color: '#F7E9CF' }}>
                      Trouver un {v.category.split(' ')[0]}
                    </button>
                  )}
                  <button onClick={() => toast.success('Prestataire ajouté aux favoris')} className="grid h-9 w-9 place-items-center rounded-xl border hover:bg-[#FAF7F2] transition" style={{ borderColor: 'rgba(61,61,61,.15)' }}>
                    <svg viewBox="0 0 20 20" className="h-4 w-4" style={{ color: '#D4A574' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 1 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Explorer tab */
        <>
          <style>{`
            .cat-tile { transition: transform .25s, box-shadow .25s; }
            .cat-tile:hover { transform: translateY(-2px); box-shadow: 0 18px 38px -16px rgba(30,86,49,.35); }
            .cat-tile[aria-pressed="true"] { box-shadow: 0 0 0 2px #1E5631, 0 18px 38px -16px rgba(30,86,49,.35); }
          `}</style>
          <div className="mb-5">
            <h2 className="font-display text-xl mb-3" style={{ color: '#0E2916' }}>Découverte</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {[
                { id: 'photo',   icon: '📸', label: 'Photo',     count: 87 },
                { id: 'food',    icon: '🍽️', label: 'Traiteur',  count: 62 },
                { id: 'decor',   icon: '💐', label: 'Déco',      count: 48 },
                { id: 'salle',   icon: '🏛️', label: 'Salle',     count: 35 },
                { id: 'dj',      icon: '🎵', label: 'DJ',        count: 41 },
                { id: 'tenue',   icon: '👗', label: 'Tenue',     count: 73 },
                { id: 'voiture', icon: '🚗', label: 'Voiture',   count: 18 },
                { id: 'anim',    icon: '🎤', label: 'Animation', count: 24 },
              ].map(cat => (
                <button key={cat.id}
                  onClick={() => toast.info(`${cat.label} — ${cat.count} prestataires · disponible prochainement`)}
                  className="cat-tile rounded-2xl bg-white p-3 sm:p-4 text-left ring-1 ring-black/5 shadow-card"
                  aria-pressed="false">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="text-[13px] font-medium leading-tight" style={{ color: '#0E2916' }}>{cat.label}</div>
                  <div className="text-[10px] mt-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{cat.count}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden ring-1" style={{ background: 'linear-gradient(135deg, #0E2916, #1E5631)', outlineColor: 'rgba(212,165,116,.2)' }}>
            <div className="p-8 text-center text-[#F7E9CF]">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-3xl mb-2">500+ prestataires vérifiés</h3>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'rgba(247,233,207,.75)' }}>
                Dakar, Saint-Louis, Thiès — tous notés par des mariées SamaMariage. Réponse garantie sous 24h.
              </p>
              <button
                onClick={() => toast.info('Annuaire disponible prochainement !')}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition"
                style={{ background: '#D4A574', color: '#3D181C' }}
              >
                Explorer l&apos;annuaire
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
