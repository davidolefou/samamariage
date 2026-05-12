'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

const TIMELINE = [
  {
    label: 'J–6 mois',
    date: 'Juin 2026',
    done: true,
    color: '#1E5631',
    tasks: [
      { id: 1, text: 'Fixer la date officielle', done: true },
      { id: 2, text: 'Définir le budget global', done: true },
      { id: 3, text: 'Créer le compte SamaMariage', done: true },
      { id: 4, text: 'Établir la liste d\'invités préliminaire', done: true },
      { id: 5, text: 'Visiter 3 lieux de réception', done: true },
    ],
  },
  {
    label: 'J–5 mois',
    date: 'Juillet 2026',
    done: true,
    color: '#1E5631',
    tasks: [
      { id: 6, text: 'Réserver le Palais des Congrès', done: true },
      { id: 7, text: 'Sélectionner le traiteur (3 dégustations)', done: true },
      { id: 8, text: 'Briefer le tailleur des tenues', done: true },
      { id: 9, text: 'Lancer le groupe ndaxal WhatsApp', done: true },
    ],
  },
  {
    label: 'J–4 mois',
    date: 'Août 2026',
    done: true,
    color: '#2d7a47',
    tasks: [
      { id: 10, text: 'Signer contrat traiteur (Le Carré)', done: true },
      { id: 11, text: 'Choisir photographe (Adams Sidibé)', done: true },
      { id: 12, text: 'Valider les tenues takk & céet', done: false },
      { id: 13, text: 'Commander première série faire-part', done: false },
    ],
  },
  {
    label: 'J–3 mois',
    date: 'Septembre 2026',
    done: false,
    color: '#D4A574',
    tasks: [
      { id: 14, text: 'Envoyer les faire-part (450 personnes)', done: false },
      { id: 15, text: 'Ouvrir portail RSVP SamaMariage', done: false },
      { id: 16, text: 'Réserver le DJ / orchestre', done: false },
      { id: 17, text: 'Essayage 1 — robe réception', done: false },
      { id: 18, text: 'Finaliser décorateur (Aida Décor)', done: false },
    ],
  },
  {
    label: 'J–2 mois',
    date: 'Octobre 2026',
    done: false,
    color: '#B98548',
    tasks: [
      { id: 19, text: 'Relancer les RSVP non répondus', done: false },
      { id: 20, text: 'Plan de table préliminaire', done: false },
      { id: 21, text: 'Essayage 2 — robe réception', done: false },
      { id: 22, text: 'Confirmer transport famille', done: false },
    ],
  },
  {
    label: 'J–1 mois',
    date: 'Novembre 2026',
    done: false,
    color: '#722F37',
    tasks: [
      { id: 23, text: 'Liste finale invités (450 confirmés)', done: false },
      { id: 24, text: 'Finaliser plan de table', done: false },
      { id: 25, text: 'Cérémonie de henné — confirmer artiste', done: false },
      { id: 26, text: 'Répétition générale avec prestataires', done: false },
      { id: 27, text: 'Préparer enveloppes ndawtal', done: false },
    ],
  },
  {
    label: 'J–1 semaine',
    date: '8–14 déc 2026',
    done: false,
    color: '#3D181C',
    tasks: [
      { id: 28, text: 'Confirmation finale traiteur (quantités)', done: false },
      { id: 29, text: 'Remise des tenues au groupe ndaxal', done: false },
      { id: 30, text: 'Vérification technique salle + sono', done: false },
      { id: 31, text: 'Préparation cadeaux invités VIP', done: false },
    ],
  },
]

export default function PlanningPage() {
  const [tasks, setTasks] = useState(() => TIMELINE.flatMap(p => p.tasks))
  const [generating, setGenerating] = useState(false)
  const [activePhase, setActivePhase] = useState<number | null>(null)

  const totalTasks = tasks.length
  const doneTasks  = tasks.filter(t => t.done).length
  const pct = Math.round((doneTasks / totalTasks) * 100)

  function toggle(id: number) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    const task = tasks.find(t => t.id === id)
    if (task && !task.done) toast.success('Tâche complétée !', { description: task.text })
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); toast.success('Rétroplanning régénéré par l\'IA !') }, 2800)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>15 déc 2026 · J‑216</div>
          <p className="text-sm" style={{ color: 'rgba(61,61,61,.65)' }}>{doneTasks}/{totalTasks} tâches complétées · {pct}% prête</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition disabled:opacity-60"
          style={{ background: '#1E5631', color: '#F7E9CF' }}
        >
          {generating
            ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Génération IA…</>
            : <><svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h5M20 20v-5h-5M4.93 12A8 8 0 1 0 19.07 8"/></svg>Régénérer le rétroplanning</>
          }
        </button>
      </div>

      {/* Global progress */}
      <div className="rounded-2xl p-5 mb-6 text-[#F7E9CF]" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Avancement global</div>
            <div className="mt-1 font-display text-3xl">{pct}% <span className="text-lg font-normal" style={{ color: 'rgba(247,233,207,.7)' }}>prête</span></div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl text-[#D4A574]">{doneTasks}</div>
            <div className="text-[12px]" style={{ color: 'rgba(247,233,207,.7)' }}>sur {totalTasks} tâches</div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #D4A574, #F7E9CF)' }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: 'J–6m & J–5m', done: TIMELINE.slice(0, 2).flatMap(p => tasks.filter(t => TIMELINE.slice(0, 2).flatMap(ph => ph.tasks).some(pt => pt.id === t.id && t.done))).length, total: TIMELINE.slice(0, 2).flatMap(p => p.tasks).length },
            { label: 'J–4m & J–3m', done: TIMELINE.slice(2, 4).flatMap(p => tasks.filter(t => TIMELINE.slice(2, 4).flatMap(ph => ph.tasks).some(pt => pt.id === t.id && t.done))).length, total: TIMELINE.slice(2, 4).flatMap(p => p.tasks).length },
            { label: 'J–2m à J‑7j', done: 0, total: TIMELINE.slice(4).flatMap(p => p.tasks).length },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,.1)' }}>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.8)' }}>{s.label}</div>
              <div className="font-display text-lg mt-1">{s.done}<span className="text-sm" style={{ color: 'rgba(247,233,207,.6)' }}>/{s.total}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {TIMELINE.map((phase, phaseIdx) => {
          const phaseTasks = tasks.filter(t => phase.tasks.some(pt => pt.id === t.id))
          const phaseDone  = phaseTasks.filter(t => t.done).length
          const isOpen = activePhase === phaseIdx
          return (
            <div key={phaseIdx} className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#FAF7F2]/50 transition text-left"
                onClick={() => setActivePhase(isOpen ? null : phaseIdx)}
              >
                {/* Timeline dot */}
                <div className="relative flex-shrink-0 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full grid place-items-center ring-2 ring-white" style={{ background: phase.color }}>
                    {phaseDone === phaseTasks.length
                      ? <svg viewBox="0 0 20 20" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m4 10 4 4 8-8"/></svg>
                      : <span className="font-display text-sm text-white">{phaseIdx + 1}</span>
                    }
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{phase.date}</div>
                      <div className="font-display text-xl" style={{ color: '#0E2916' }}>{phase.label}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] rounded-full px-2.5 py-1" style={{
                        fontFamily: 'var(--font-jetbrains)',
                        background: phaseDone === phaseTasks.length ? '#EAF1EC' : 'rgba(61,61,61,.07)',
                        color: phaseDone === phaseTasks.length ? '#1E5631' : 'rgba(61,61,61,.55)',
                      }}>{phaseDone}/{phaseTasks.length}</span>
                      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 transition-transform" style={{ color: 'rgba(61,61,61,.35)', transform: isOpen ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#F4E4C1] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${phaseTasks.length > 0 ? (phaseDone / phaseTasks.length) * 100 : 0}%`, background: phase.color }} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <ul className="border-t border-black/5 divide-y divide-black/5">
                  {phaseTasks.map(task => (
                    <li
                      key={task.id}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]/60 transition ${task.done ? 'opacity-60' : ''}`}
                      onClick={() => toggle(task.id)}
                    >
                      <input type="checkbox" className="check" checked={task.done} onChange={() => toggle(task.id)} onClick={e => e.stopPropagation()} />
                      <span className="text-sm flex-1" style={{ color: '#0E2916', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(30,86,49,.06), rgba(212,165,116,.06))', border: '1px solid rgba(30,86,49,.1)' }}>
        <div className="font-display text-xl mb-2" style={{ color: '#0E2916' }}>Tu veux affiner ce planning ?</div>
        <p className="text-sm mb-4" style={{ color: 'rgba(61,61,61,.65)' }}>Sama IA peut ajouter des tâches selon tes prestataires confirmés et tes cérémonies.</p>
        <Link href="/app/serenite" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition" style={{ background: '#1E5631', color: '#F7E9CF' }}>
          Demander à Sama Coach
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </Link>
      </div>
    </>
  )
}
