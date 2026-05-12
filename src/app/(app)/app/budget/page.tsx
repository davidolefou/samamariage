'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { toast } from 'sonner'

/* ── Mock categories for empty-state / demo ── */
const MOCK_CATS = [
  { id: 'loc', name: 'Lieu de réception',    icon: '🏛️', color: '#1E5631', pct: 28, budget: 3_360_000, spent: 756_000,   tips: ['Négociez le vendredi au lieu du samedi (-20%)', 'Vérifiez capacité électrique pour DJ'] },
  { id: 'tra', name: 'Traiteur',              icon: '🍽️', color: '#2d7a47', pct: 22, budget: 2_640_000, spent: 528_000,   tips: ['Menu buffet vs servi à table : économie de 18%', 'Prévoyez 10% de surplus pour les imprévus'] },
  { id: 'ten', name: 'Tenues & ndaxal',       icon: '👗', color: '#D4A574', pct: 15, budget: 1_800_000, spent: 600_000,   tips: ['Commandez les tissus au marché HLM', 'Prévoyez 2 essayages minimum'] },
  { id: 'dec', name: 'Décoration',            icon: '🌸', color: '#722F37', pct: 10, budget: 1_200_000, spent: 1_296_000,  tips: ['⚠ Dépassement +8% — renégocier les fleurs', 'Location vs achat : économie de 35%'], over: true },
  { id: 'pho', name: 'Photographe',           icon: '📷', color: '#4a9e68', pct: 7,  budget: 850_000,  spent: 850_000,   tips: ['Book confirmé · livraison en J+15 ✓'] },
  { id: 'mus', name: 'Musique & DJ',          icon: '🎵', color: '#e8c49a', pct: 5,  budget: 600_000,  spent: 0,         tips: ['Comparez 3 DJs · budget actuel correct'] },
  { id: 'fai', name: 'Faire-part',            icon: '💌', color: '#a85565', pct: 2,  budget: 240_000,  spent: 0,         tips: ['Imprimeur Mansour Print recommandé'] },
  { id: 'coi', name: 'Coiffure & Maquillage',icon: '💄', color: '#6bc285', pct: 3,  budget: 360_000,  spent: 0,         tips: ['Bloc 3 artistes pour les 3 cérémonies'] },
  { id: 'tra2', name: 'Transport',            icon: '🚗', color: '#c97a88', pct: 3,  budget: 360_000,  spent: 0,         tips: ['Location mini-bus x3 pour la famille'] },
  { id: 'div', name: 'Divers & imprévus',     icon: '✨', color: '#B98548', pct: 5,  budget: 590_000,  spent: 0,         tips: ['Gardez toujours 5% pour imprévus'] },
]

const AI_INSIGHTS = [
  { type: 'warning', icon: '⚠', title: 'Dépassement déco de +8%', text: 'Tu es 96 000 F au-dessus. Réduire les fleurs des tables de 40% économise 144 000 F.', cta: 'Voir le détail', href: '/app/budget/dec' },
  { type: 'tip',     icon: '💡', title: 'Économie possible : 280 000 F', text: 'En choisissant le vendredi pour la réception, le Palais des Congrès offre un tarif réduit.', cta: 'Comparer', href: '#' },
  { type: 'success', icon: '✓',  title: 'Photographe bien optimisé', text: 'Tarif Adams Sidibé est 12% en dessous du marché pour la même qualité. Bon choix !', cta: 'Voir son profil', href: '/app/prestataires' },
]

export default function BudgetPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addCat, setAddCat] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addAmt, setAddAmt] = useState('')
  const donutRef = useRef<SVGSVGElement>(null)

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const weddingId = wedding?.id ?? ''
  const { data: budget, refetch } = trpc.budget.get.useQuery({ weddingId }, { enabled: !!weddingId })
  const generateBudget = trpc.budget.generate.useMutation({
    onSuccess: () => { refetch(); setGenerating(false); toast.success('Budget IA régénéré !') },
    onError: (e) => { toast.error(e.message); setGenerating(false) },
  })

  /* Use real data if available, else mock */
  const cats = budget?.categories?.length
    ? budget.categories.map((c, i) => ({
        id: c.id,
        name: c.name,
        icon: MOCK_CATS[i % MOCK_CATS.length]?.icon ?? '📦',
        color: MOCK_CATS[i % MOCK_CATS.length]?.color ?? '#1E5631',
        pct: Math.round((c.amountRecommended / (budget.totalPlanned || 1)) * 100),
        budget: c.amountRecommended,
        spent: c.amountSpent,
        over: c.amountSpent > c.amountRecommended,
        tips: c.tips ?? [],
      }))
    : MOCK_CATS

  const totalBudget = budget?.totalPlanned ?? 12_000_000
  const totalSpent  = cats.reduce((s, c) => s + c.spent, 0)
  const totalLeft   = Math.max(0, totalBudget - totalSpent)
  const overBudget  = cats.reduce((s, c) => s + Math.max(0, c.spent - c.budget), 0)
  const spentPct    = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 35

  /* Animate donut on mount */
  useEffect(() => {
    const C = 2 * Math.PI * 54
    const segs = donutRef.current?.querySelectorAll<SVGCircleElement>('.bseg')
    segs?.forEach(seg => {
      const target = seg.getAttribute('data-target') ?? '0'
      seg.style.strokeDashoffset = String(C)
      setTimeout(() => {
        seg.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)'
        seg.style.strokeDashoffset = target
      }, 300)
    })
  }, [])

  function handleRegenerate() {
    if (!wedding) return
    setGenerating(true)
    generateBudget.mutate({
      weddingId: wedding.id,
      budgetTotal: totalBudget,
      guestCount: wedding.guestCount,
      city: wedding.city,
      style: wedding.style,
      ceremonies: wedding.ceremonies?.map(c => c.type) ?? ['reception'],
    })
  }

  /* SVG donut values */
  const C2 = 2 * Math.PI * 54
  const topCats = cats.slice(0, 6)
  let cumPct = 0
  const donutSegs = topCats.map(cat => {
    const pct = cat.pct / 100
    const offset = C2 * (1 - pct)
    const rotation = cumPct * 360
    cumPct += pct
    return { ...cat, offset, rotation }
  })

  return (
    <>
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>12 000 000 FCFA · 10 postes</div>
          <p className="text-sm" style={{ color: 'rgba(61,61,61,.65)' }}>Mariage du 15 déc 2026 · Dakar · 450 invités</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium border hover:bg-[#FAF7F2] transition"
            style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 4v12M4 10h12"/></svg>
            Ajouter dépense
          </button>
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition disabled:opacity-60"
            style={{ background: '#1E5631', color: '#F7E9CF' }}
          >
            {generating ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Génération…</>
            ) : (
              <><svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h5M20 20v-5h-5M4.93 12A8 8 0 1 0 19.07 8"/></svg>Régénérer avec l&apos;IA</>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Budget total', val: formatFCFA(totalBudget), dot: '#1E5631', sub: '12M FCFA · IA optimisé' },
          { label: 'Dépensé', val: formatFCFA(totalSpent), dot: '#D4A574', sub: `${spentPct}% du budget` },
          { label: 'Restant', val: formatFCFA(totalLeft), dot: '#1E5631', sub: `${100 - spentPct}% disponible` },
          { label: 'Dépassements', val: overBudget > 0 ? formatFCFA(overBudget) : '—', dot: overBudget > 0 ? '#722F37' : '#1E5631', sub: overBudget > 0 ? '1 poste en alerte' : 'Tout est dans les clous' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{s.label}</span>
            </div>
            <div className="font-display text-xl leading-none" style={{ color: '#0E2916' }}>{s.val}</div>
            <div className="mt-1 text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid lg:grid-cols-12 gap-5 mb-5">

        {/* Left — Donut + progress bar */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Donut card */}
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Répartition globale</div>

            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <svg ref={donutRef} viewBox="0 0 140 140" className="h-44 w-44">
                  <circle cx="70" cy="70" r="54" fill="none" stroke="#F4E4C1" strokeWidth="22"/>
                  {donutSegs.map((seg, i) => (
                    <circle
                      key={i}
                      className="bseg"
                      cx="70" cy="70" r="54"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="22"
                      strokeDasharray={String(C2)}
                      strokeDashoffset={String(C2)}
                      data-target={String(seg.offset)}
                      style={{ transform: `rotate(${seg.rotation - 90}deg)`, transformOrigin: 'center' }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <div className="font-display text-2xl leading-none" style={{ color: '#0E2916' }}>{spentPct}%</div>
                    <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>utilisé</div>
                  </div>
                </div>
              </div>

              <ul className="flex-1 space-y-2.5">
                {topCats.map(cat => (
                  <li key={cat.id} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="flex-1 text-[12px] truncate" style={{ color: 'rgba(61,61,61,.8)' }}>{cat.name}</span>
                    <span className="text-[11px] font-medium shrink-0" style={{ fontFamily: 'var(--font-jetbrains)', color: '#0E2916' }}>{cat.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Global progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-[11px] mb-2" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>
                <span>Dépensé</span>
                <span style={{ color: spentPct > 90 ? '#722F37' : '#1E5631' }}>{spentPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#F4E4C1] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${spentPct}%`, background: 'linear-gradient(90deg, #1E5631, #D4A574, #722F37)' }} />
              </div>
            </div>
          </div>

          {/* AI Insights panel */}
          <div className="rounded-2xl overflow-hidden ring-1" style={{ background: 'linear-gradient(135deg, #0E2916, #1E5631)', outlineColor: 'rgba(212,165,116,.2)' }}>
            <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl shrink-0" style={{ background: 'rgba(212,165,116,.2)' }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ color: '#D4A574' }} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama IA · Insights</div>
                <div className="text-sm font-medium" style={{ color: '#F7E9CF' }}>3 recommandations actives</div>
              </div>
            </div>

            <ul className="divide-y divide-white/10">
              {AI_INSIGHTS.map((ins, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base shrink-0">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight" style={{ color: '#F7E9CF' }}>{ins.title}</div>
                      <div className="mt-1 text-[12px] leading-snug" style={{ color: 'rgba(247,233,207,.7)' }}>{ins.text}</div>
                      <Link href={ins.href} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium hover:opacity-80 transition" style={{ color: '#D4A574' }}>
                        {ins.cta} <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — Categories list */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <div className="font-display text-lg" style={{ color: '#0E2916' }}>Postes budgétaires</div>
              <span className="text-[11px] rounded-full px-2.5 py-1" style={{ fontFamily: 'var(--font-jetbrains)', background: '#EAF1EC', color: '#1E5631' }}>{cats.length} catégories</span>
            </div>

            <ul className="divide-y divide-black/5">
              {cats.map(cat => {
                const catPct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 120) : 0
                const isExpanded = expanded === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      className="w-full px-5 py-4 text-left hover:bg-[#FAF7F2]/50 transition"
                      onClick={() => setExpanded(isExpanded ? null : cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0 w-7 text-center">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium truncate" style={{ color: '#0E2916' }}>{cat.name}</span>
                              {cat.over && <span className="text-[9px] rounded-full px-1.5 py-0.5 shrink-0" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37', fontFamily: 'var(--font-jetbrains)' }}>⚠ OVER</span>}
                              {catPct >= 100 && !cat.over && <span className="text-[9px] rounded-full px-1.5 py-0.5 shrink-0" style={{ background: '#EAF1EC', color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>✓ PAYÉ</span>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[12px] font-medium" style={{ color: '#0E2916', fontFamily: 'var(--font-jetbrains)' }}>{formatFCFA(cat.spent)}</div>
                              <div className="text-[10px]" style={{ color: 'rgba(61,61,61,.45)', fontFamily: 'var(--font-jetbrains)' }}>/ {formatFCFA(cat.budget)}</div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#F4E4C1] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{
                              width: `${Math.min(catPct, 100)}%`,
                              background: cat.over ? 'linear-gradient(90deg, #722F37, #a85565)' : catPct >= 100 ? '#1E5631' : `linear-gradient(90deg, ${cat.color}, #D4A574)`,
                            }} />
                          </div>
                          <div className="mt-1 flex justify-between text-[10px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.45)' }}>
                            <span>{catPct}% utilisé</span>
                            <span>{formatFCFA(Math.max(0, cat.budget - cat.spent))} restant</span>
                          </div>
                        </div>
                        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ color: 'rgba(61,61,61,.35)', transform: isExpanded ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg>
                      </div>
                    </button>

                    {/* Expanded state */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-0" style={{ background: 'rgba(250,247,242,.5)' }}>
                        {cat.tips.length > 0 && (
                          <div className="mb-3 rounded-xl p-3" style={{ background: 'rgba(30,86,49,.06)', border: '1px solid rgba(30,86,49,.1)' }}>
                            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-jetbrains)', color: '#1E5631' }}>💡 Conseils Sama IA</div>
                            <ul className="space-y-1">
                              {cat.tips.map((tip, j) => (
                                <li key={j} className="text-[12px] leading-snug" style={{ color: 'rgba(61,61,61,.75)' }}>· {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Link
                            href={`/app/budget/${cat.id}`}
                            className="flex-1 text-center rounded-xl py-2 text-[12px] font-medium hover:opacity-90 transition"
                            style={{ background: '#1E5631', color: '#F7E9CF' }}
                          >
                            Voir les dépenses
                          </Link>
                          <button
                            onClick={() => { setAddCat(cat.id); setShowAddModal(true) }}
                            className="flex-1 text-center rounded-xl py-2 text-[12px] font-medium border hover:bg-[#EAF1EC] transition"
                            style={{ borderColor: '#1E5631', color: '#1E5631' }}
                          >
                            + Ajouter dépense
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ── ADD EXPENSE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(14,41,22,.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: '#0E2916' }}>Ajouter une dépense</h2>
              <button onClick={() => setShowAddModal(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#FAF7F2]">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>Catégorie</label>
                <select
                  value={addCat}
                  onChange={e => setAddCat(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[#1E5631]"
                  style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}
                >
                  <option value="">Sélectionner…</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>Description</label>
                <input
                  type="text"
                  value={addDesc}
                  onChange={e => setAddDesc(e.target.value)}
                  placeholder="Ex: Acompte décorateur Aida"
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[#1E5631]"
                  style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>Montant (FCFA)</label>
                <input
                  type="text"
                  value={addAmt}
                  onChange={e => setAddAmt(e.target.value)}
                  placeholder="500 000"
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[#1E5631]"
                  style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl py-3 text-sm font-medium border hover:bg-[#FAF7F2] transition"
                  style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}
                >Annuler</button>
                <button
                  onClick={() => {
                    if (!addCat || !addDesc || !addAmt) { toast.error('Remplis tous les champs'); return }
                    router.push(`/app/budget/${addCat}`)
                    setShowAddModal(false)
                  }}
                  className="rounded-xl py-3 text-sm font-medium hover:opacity-90 transition"
                  style={{ background: '#1E5631', color: '#F7E9CF' }}
                >Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
