'use client'
import { useState } from 'react'
import { formatFCFA } from '@/lib/utils'
import { toast } from 'sonner'

const FABRICS = [
  { id: 'bazin', name: 'Bazin riche bleu nuit', votes: 9, color: 'linear-gradient(135deg, #1B2A4E, #0E1A38)', pattern: 'repeating-linear-gradient(45deg, rgba(212,165,116,.3) 0 2px, transparent 2px 14px)' },
  { id: 'wax', name: 'Wax kente royal', votes: 4, color: 'linear-gradient(135deg, #722F37, #B98548)', pattern: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.15) 0 2px, transparent 2px 10px)' },
  { id: 'soie', name: 'Soie brodée bordeaux', votes: 2, color: 'linear-gradient(135deg, #3D181C, #722F37)', pattern: 'radial-gradient(circle at 6px 6px, rgba(212,165,116,.4) 1px, transparent 2px)' },
]

const BRIDESMAIDS = [
  { id: 1, name: 'Aminata Ndiaye', role: 'Dame d\'honneur', paid: true, amount: 80_000, avatar: 'AN', gradient: 'linear-gradient(135deg,#722F37,#D4A574)' },
  { id: 2, name: 'Rokhaya Seck', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'RS', gradient: 'linear-gradient(135deg,#1E5631,#D4A574)' },
  { id: 3, name: 'Fatou Ba', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'FB', gradient: 'linear-gradient(135deg,#D4A574,#722F37)' },
  { id: 4, name: 'Maty Fall', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'MF', gradient: 'linear-gradient(135deg,#0E2916,#D4A574)' },
  { id: 5, name: 'Ndeye Diallo', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'ND', gradient: 'linear-gradient(135deg,#B98548,#722F37)' },
  { id: 6, name: 'Coumba Mbaye', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'CM', gradient: 'linear-gradient(135deg,#4a9e68,#1E5631)' },
  { id: 7, name: 'Aïda Gueye', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'AG', gradient: 'linear-gradient(135deg,#722F37,#1E5631)' },
  { id: 8, name: 'Seynabou Diouf', role: 'Demoiselle d\'honneur', paid: true, amount: 53_333, avatar: 'SD', gradient: 'linear-gradient(135deg,#D4A574,#0E2916)' },
  { id: 9, name: 'Astou Sarr', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'AS2', gradient: 'linear-gradient(135deg,#c97a88,#722F37)' },
  { id: 10, name: 'Bineta Faye', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'BF', gradient: 'linear-gradient(135deg,#e8c49a,#B98548)' },
  { id: 11, name: 'Khady Niang', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'KN', gradient: 'linear-gradient(135deg,#6bc285,#1E5631)' },
  { id: 12, name: 'Marème Diop', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'MD2', gradient: 'linear-gradient(135deg,#a85565,#722F37)' },
  { id: 13, name: 'Oumou Coulibaly', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'OC', gradient: 'linear-gradient(135deg,#2d7a47,#0E2916)' },
  { id: 14, name: 'Binta Diallo', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'BD2', gradient: 'linear-gradient(135deg,#B98548,#D4A574)' },
  { id: 15, name: 'Soda Mboup', role: 'Demoiselle d\'honneur', paid: false, amount: 0, avatar: 'SM2', gradient: 'linear-gradient(135deg,#1E5631,#722F37)' },
]

const CEREMONIES = [
  { key: 'takk',       label: 'Cérémonie du Takk',   color: '#D4A574', fabric: 'Wax kente royal',         look: 'Grand boubou' },
  { key: 'ceet',       label: 'Cérémonie du Céet',    color: '#1E5631', fabric: 'Bazin riche bleu nuit',   look: 'Tenue traditionnelle complète' },
  { key: 'reception',  label: 'Réception',             color: '#722F37', fabric: 'Soie brodée bordeaux',    look: 'Robe de mariée + robe de soirée' },
]

export default function TenuesPage() {
  const [selectedFabric, setSelectedFabric] = useState('bazin')
  const [bridesmaids, setBridesmaids] = useState(BRIDESMAIDS)

  const paid = bridesmaids.filter(b => b.paid).length
  const totalCollected = bridesmaids.reduce((s, b) => s + b.amount, 0)
  const totalTarget = 800_000

  function markPaid(id: number) {
    setBridesmaids(prev => prev.map(b => b.id === id ? { ...b, paid: true, amount: Math.round(totalTarget / BRIDESMAIDS.length) } : b))
    toast.success('Cotisation enregistrée !')
  }

  return (
    <>
      <style>{`
        .look-card { transition: transform .25s, box-shadow .25s; }
        .look-card:hover { transform: translateY(-2px); }
        .look-takk  { background: radial-gradient(120% 100% at 30% 10%, #D4A574 0%, #722F37 55%, #3D181C 100%); }
        .look-ceet  { background: linear-gradient(180deg, #F4E4C1 0%, #D4A574 60%, #B98548 100%); }
        .look-recep { background: radial-gradient(140% 100% at 70% 70%, #1E5631 0%, #173F24 50%, #0E2916 100%); }
      `}</style>

      {/* Tes 3 looks */}
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl" style={{ color: '#0E2916' }}>Tes 3 looks</h2>
          <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>essayages programmés</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              cls: 'look-takk', label: 'tenue takk · bazin',
              date: 'Takk · 12 déc', name: 'Bazin riche brodé or',
              status: '✓ confirmée', statusStyle: { background: '#EAF1EC', color: '#1E5631' },
              sub: 'Essayage 2 · J-15', link: 'Voir →', linkColor: '#1E5631',
            },
            {
              cls: 'look-ceet', label: 'tenue céet · boubou',
              date: 'Céet · 13 déc', name: 'Boubou ivoire & cuivre',
              status: 'en cours', statusStyle: { background: '#FBF4EA', color: '#B98548' },
              sub: 'Essayage 1 · J-32', link: 'Voir →', linkColor: '#1E5631',
            },
            {
              cls: 'look-recep', label: 'réception · robe',
              date: 'Réception · 15 déc', name: 'Robe blanche & voile or',
              status: 'à choisir', statusStyle: { background: 'rgba(114,47,55,.1)', color: '#722F37' },
              sub: "Pas d'essayage prévu", link: 'Choisir →', linkColor: '#722F37',
            },
          ].map(look => (
            <article key={look.cls} className="look-card relative rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5">
              <div className={`${look.cls}`} style={{ aspectRatio: '3/4', position: 'relative' }}>
                <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest font-mono text-white/70">{look.label}</span>
              </div>
              <div className="p-4 bg-[#FAF7F2]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>{look.date}</div>
                    <h3 className="font-display text-lg" style={{ color: '#0E2916' }}>{look.name}</h3>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0 ml-2" style={look.statusStyle}>{look.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px]">
                  <span style={{ color: 'rgba(61,61,61,.55)' }}>{look.sub}</span>
                  <button className="font-medium hover:opacity-75 transition" style={{ color: look.linkColor }}>{look.link}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Demoiselles',   val: `${BRIDESMAIDS.length}`, color: '#1E5631' },
          { label: 'Cotisations',   val: `${paid}/${BRIDESMAIDS.length}`, color: '#D4A574' },
          { label: 'Collecté',      val: formatFCFA(totalCollected), color: '#1E5631' },
          { label: 'Objectif',      val: formatFCFA(totalTarget), color: '#B98548' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{s.label}</div>
            <div className="font-display text-2xl" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Left — Fabric vote */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Vote du tissu — groupe ndaxal</div>

            <div className="space-y-3">
              {FABRICS.map(fab => (
                <button
                  key={fab.id}
                  onClick={() => setSelectedFabric(fab.id)}
                  className={`w-full rounded-xl overflow-hidden ring-2 transition ${selectedFabric === fab.id ? 'ring-[#D4A574]' : 'ring-transparent'}`}
                  style={{ outlineColor: selectedFabric === fab.id ? '#D4A574' : 'transparent' }}
                >
                  <div className="relative h-20 flex items-end p-3" style={{ background: fab.color }}>
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: fab.pattern }} />
                    <div className="relative flex items-end justify-between w-full">
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.8)' }}>Tissu</div>
                        <div className="font-display text-base text-[#F7E9CF]">{fab.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-display text-2xl text-[#D4A574]">{fab.votes}</div>
                          <div className="text-[10px]" style={{ color: 'rgba(247,233,207,.6)' }}>votes</div>
                        </div>
                        {selectedFabric === fab.id && (
                          <div className="grid h-7 w-7 place-items-center rounded-full" style={{ background: '#D4A574', color: '#3D181C' }}>
                            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 8 3 3 7-7"/></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => toast.success('Vote envoyé au groupe WhatsApp !')} className="flex-1 rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition" style={{ background: '#1E5631', color: '#F7E9CF' }}>
                Valider le tissu voté
              </button>
              <button onClick={() => toast.info('Partage WhatsApp…')} className="rounded-xl px-3 py-2.5 hover:bg-[#EAF1EC] transition" style={{ background: 'rgba(37,211,102,.1)', color: '#25D366' }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>
              </button>
            </div>
          </div>

          {/* Per-ceremony tenues */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Tenues par cérémonie</div>
            <div className="space-y-3">
              {CEREMONIES.map(cer => (
                <div key={cer.key} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(61,61,61,.03)', border: '1px solid rgba(61,61,61,.06)' }}>
                  <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0" style={{ background: cer.color }}>
                    <span className="text-lg text-white">👗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: '#0E2916' }}>{cer.label}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.55)' }}>{cer.fabric} · {cer.look}</div>
                  </div>
                  <span className="text-[10px] rounded-full px-2.5 py-1 shrink-0" style={{ background: '#EAF1EC', color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>Validé</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Bridesmaids cotisations */}
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg" style={{ color: '#0E2916' }}>Cotisations du groupe</div>
              <span className="text-[11px] rounded-full px-2.5 py-1" style={{ fontFamily: 'var(--font-jetbrains)', background: '#EAF1EC', color: '#1E5631' }}>{paid}/{BRIDESMAIDS.length} payées</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[#F4E4C1] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.round(totalCollected / totalTarget * 100)}%`, background: 'linear-gradient(90deg, #1E5631, #D4A574)' }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>
              <span>{formatFCFA(totalCollected)} reçus</span>
              <span>objectif {formatFCFA(totalTarget)}</span>
            </div>
          </div>

          <ul className="divide-y divide-black/5 max-h-[520px] overflow-y-auto nice-scroll">
            {bridesmaids.map(b => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 rounded-full grid place-items-center font-display text-sm text-white shrink-0" style={{ background: b.gradient }}>
                  {b.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#0E2916' }}>{b.name}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>{b.role}</div>
                </div>
                {b.paid ? (
                  <div className="text-right shrink-0">
                    <div className="font-medium text-[13px]" style={{ fontFamily: 'var(--font-jetbrains)', color: '#1E5631' }}>{formatFCFA(b.amount)}</div>
                    <div className="text-[10px]" style={{ color: '#1E5631' }}>✓ Payé</div>
                  </div>
                ) : (
                  <button
                    onClick={() => markPaid(b.id)}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-medium border hover:bg-[#EAF1EC] transition shrink-0"
                    style={{ borderColor: '#1E5631', color: '#1E5631' }}
                  >Marquer payé</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
