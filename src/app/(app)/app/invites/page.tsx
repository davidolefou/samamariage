'use client'
import { useState } from 'react'
import { toast } from 'sonner'

type RSVPStatus = 'Confirmé' | 'En attente' | 'Décliné' | 'Non répondu'
type CeremonyKey = 'takk' | 'ceet' | 'reception'
type Tab = 'list' | 'table' | 'rsvp'

interface Guest {
  id: number; name: string; relation: string; side: 'Mariée' | 'Marié'; phone: string
  status: RSVPStatus; ceremonies: CeremonyKey[]; plus1?: boolean; table?: number
}

const STATUS_STYLES: Record<RSVPStatus, { bg: string; text: string; dot: string }> = {
  'Confirmé':    { bg: '#EAF1EC', text: '#1E5631', dot: '#1E5631' },
  'En attente':  { bg: '#FBF4EA', text: '#B98548', dot: '#D4A574' },
  'Décliné':     { bg: 'rgba(114,47,55,.1)', text: '#722F37', dot: '#722F37' },
  'Non répondu': { bg: 'rgba(61,61,61,.07)', text: 'rgba(61,61,61,.55)', dot: 'rgba(61,61,61,.3)' },
}

const GUESTS: Guest[] = [
  { id: 1,  name: 'Mame Diarra Diop',   relation: 'Mère',          side: 'Mariée', phone: '+221 77 111 22 33', status: 'Confirmé',    ceremonies: ['takk','ceet','reception'], table: 1 },
  { id: 2,  name: 'Ibrahima Diop',       relation: 'Père',          side: 'Mariée', phone: '+221 77 111 22 44', status: 'Confirmé',    ceremonies: ['takk','ceet','reception'], table: 1 },
  { id: 3,  name: 'Tonton Modou Sow',    relation: 'Oncle',         side: 'Marié',  phone: '+221 77 222 33 44', status: 'Confirmé',    ceremonies: ['ceet','reception'], table: 2, plus1: true },
  { id: 4,  name: 'Aminata Ndiaye',      relation: 'Amie proche',   side: 'Mariée', phone: '+221 77 333 44 55', status: 'Confirmé',    ceremonies: ['takk','ceet','reception'], table: 3 },
  { id: 5,  name: 'Fatou Ba',            relation: 'Collègue',      side: 'Mariée', phone: '+221 77 444 55 66', status: 'En attente',  ceremonies: ['reception'] },
  { id: 6,  name: 'Cheikh Diallo',       relation: 'Cousin',        side: 'Marié',  phone: '+221 77 555 66 77', status: 'En attente',  ceremonies: ['ceet','reception'] },
  { id: 7,  name: 'Rokhaya Seck',        relation: 'Tante',         side: 'Mariée', phone: '+221 77 666 77 88', status: 'Confirmé',    ceremonies: ['takk','reception'], table: 4 },
  { id: 8,  name: 'Moussa Diallo',       relation: 'Ami du marié',  side: 'Marié',  phone: '+221 77 777 88 99', status: 'Non répondu', ceremonies: ['reception'] },
  { id: 9,  name: 'Adja Fall',           relation: 'Cousine',       side: 'Mariée', phone: '+221 77 888 99 00', status: 'Non répondu', ceremonies: ['reception'] },
  { id: 10, name: 'Serigne Mbaye',       relation: 'Voisin',        side: 'Mariée', phone: '+221 77 999 00 11', status: 'Décliné',     ceremonies: ['reception'] },
]

type TableKind = 't-vip' | 't-fam' | 't-amis' | 't-pro' | 't-other'
interface TableData { i: number; lbl: string; seats: number; kind: TableKind }

function buildTables(): TableData[] {
  const templates: Omit<TableData, 'i'>[] = [
    { kind: 't-vip',   lbl: 'VIP',             seats: 8 },
    { kind: 't-vip',   lbl: 'VIP 2',           seats: 6 },
    { kind: 't-fam',   lbl: 'Famille mariée',  seats: 10 },
    { kind: 't-fam',   lbl: 'Cousines',        seats: 10 },
    { kind: 't-amis',  lbl: 'Amis fac',        seats: 10 },
    { kind: 't-amis',  lbl: 'Amis Mamadou',    seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Diop',    seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Sow',     seats: 10 },
    { kind: 't-amis',  lbl: 'Amis Paris',      seats: 8 },
    { kind: 't-pro',   lbl: 'Collègues',       seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Mbaye',   seats: 10 },
    { kind: 't-amis',  lbl: 'Amis lycée',      seats: 10 },
    { kind: 't-pro',   lbl: 'Bureau mariée',   seats: 8 },
    { kind: 't-fam',   lbl: 'Famille Ba',      seats: 10 },
    { kind: 't-other', lbl: 'Divers',          seats: 10 },
    { kind: 't-amis',  lbl: 'Amis marié',      seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Diallo',  seats: 10 },
    { kind: 't-pro',   lbl: 'Collègues marié', seats: 8 },
    { kind: 't-fam',   lbl: 'Famille Fall',    seats: 10 },
    { kind: 't-amis',  lbl: 'Amis communs',    seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Ndiaye',  seats: 10 },
    { kind: 't-other', lbl: 'Voisins',         seats: 10 },
    { kind: 't-amis',  lbl: 'Amis dakar',      seats: 10 },
    { kind: 't-fam',   lbl: 'Famille Sarr',    seats: 10 },
    { kind: 't-pro',   lbl: 'Partenaires',     seats: 8 },
    { kind: 't-fam',   lbl: 'Famille Cissé',   seats: 10 },
    { kind: 't-amis',  lbl: 'Amis sport',      seats: 10 },
    { kind: 't-other', lbl: 'Invités divers',  seats: 8 },
    { kind: 't-fam',   lbl: 'Famille Touré',   seats: 10 },
    { kind: 't-other', lbl: 'Table mixte',     seats: 10 },
  ]
  return templates.map((t, i) => ({ i: i + 1, ...t }))
}

const TABLE_STYLE: Record<TableKind, { bg: string; text: string; dot: string }> = {
  't-vip':   { bg: 'linear-gradient(135deg, #722F37 0%, #3D181C 100%)', text: '#FBF4EA', dot: '#D4A574' },
  't-fam':   { bg: 'linear-gradient(135deg, #1E5631 0%, #0E2916 100%)', text: '#FBF4EA', dot: '#D4A574' },
  't-amis':  { bg: 'linear-gradient(135deg, #D4A574 0%, #B98548 100%)', text: '#3D181C', dot: '#3D181C' },
  't-pro':   { bg: '#FFFFFF', text: '#3D3D3D', dot: '#888' },
  't-other': { bg: '#FAF7F2', text: '#3D3D3D', dot: '#aaa' },
}

const RSVP_RECENT = [
  { icon: '✅', name: 'Tata Awa Sow + Tonton Modou (2 personnes)', detail: 'Confirmés pour les 3 cérémonies · il y a 12 min', pill: 'Confirmé', pillStyle: { bg: '#EAF1EC', text: '#1E5631' } },
  { icon: '✅', name: 'Famille Mbaye (5 personnes)',               detail: 'Confirmés réception · il y a 47 min',            pill: 'Confirmé', pillStyle: { bg: '#EAF1EC', text: '#1E5631' } },
  { icon: '❌', name: 'Khady Sow (Paris)',                        detail: 'Ne pourra pas venir — billet trop cher · il y a 2h', pill: 'Décliné', pillStyle: { bg: 'rgba(114,47,55,.1)', text: '#722F37' } },
  { icon: '✅', name: 'Aminata Cissé + 1',                        detail: 'Confirmée takk uniquement · il y a 3h',           pill: 'Confirmé', pillStyle: { bg: '#EAF1EC', text: '#1E5631' } },
]

const TABLES = buildTables()

export default function InvitesPage() {
  const [tab, setTab]         = useState<Tab>('list')
  const [guests]              = useState<Guest[]>(GUESTS)
  const [filter, setFilter]   = useState<RSVPStatus | 'Tous'>('Tous')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStep, setAiStep]   = useState(0)
  const [openTable, setOpenTable] = useState<number | null>(null)

  const confirmed = guests.filter(g => g.status === 'Confirmé').length
  const waiting   = guests.filter(g => g.status === 'En attente').length
  const noReply   = guests.filter(g => g.status === 'Non répondu').length

  const filtered = guests.filter(g =>
    (filter === 'Tous' || g.status === filter) &&
    (search === '' || g.name.toLowerCase().includes(search.toLowerCase()) || g.relation.toLowerCase().includes(search.toLowerCase()))
  )

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function sendReminder() {
    const targets = selected.length > 0 ? selected.length : noReply
    toast.success(`Rappel WhatsApp envoyé à ${targets} invité${targets > 1 ? 's' : ''}`)
    setSelected([])
  }

  const AI_STEPS = ['analyse de 450 invités…', 'détection des conflits familiaux…', 'optimisation par affinités…', 'équilibrage côté mariée / marié…', 'finalisation du plan…']

  function regenPlan() {
    setAiLoading(true)
    setAiStep(0)
    const cycle = (n: number) => {
      setAiStep(n)
      if (n < AI_STEPS.length - 1) setTimeout(() => cycle(n + 1), 700)
      else setTimeout(() => { setAiLoading(false); toast.success('Plan régénéré · 6 conflits évités, équilibrage 60/40') }, 700)
    }
    cycle(0)
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'list',  label: 'Liste',          count: guests.length },
    { id: 'table', label: 'Plan de table IA' },
    { id: 'rsvp',  label: 'RSVP récents',   count: 3 },
  ]

  return (
    <>
      <style>{`
        .inv-tab { color: rgba(61,61,61,.6); border-bottom: 2px solid transparent; padding-bottom: 12px; padding-top: 4px; transition: color .15s; }
        .inv-tab:hover { color: #173F24; }
        .inv-tab.active { color: #173F24; border-color: #1E5631; font-weight: 600; }
        .inv-tab .ct { display:inline-flex; padding: 0 6px; height: 18px; align-items:center; border-radius: 99px; font-family: var(--font-jetbrains); font-size: 10px; background: #F4E4C1; color: #3D3D3D; margin-left: 5px; }
        .inv-tab.active .ct { background: #1E5631; color: #F7E9CF; }
        .table-card { aspect-ratio: 1/1; border-radius: 16px; padding: 8px; transition: transform .25s, box-shadow .25s; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; }
        .table-card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -16px rgba(30,86,49,.45); }
        .table-card.selected { box-shadow: 0 0 0 2px #D4A574, 0 14px 28px -16px rgba(30,86,49,.45); }
        @keyframes ai-pulse { 0%,100% { opacity:.7; transform:scale(.97); } 50% { opacity:1; transform:scale(1.03); } }
        .ai-pulse { animation: ai-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total invités', val: `${guests.length}`, sub: 'sur 450 attendus', color: '#1E5631' },
          { label: 'Confirmés',     val: `${confirmed}`,     sub: `${Math.round(confirmed/450*100)}% du total`, color: '#1E5631' },
          { label: 'En attente',    val: `${waiting}`,       sub: "ont besoin d'un rappel", color: '#B98548' },
          { label: 'Non répondus',  val: `${noReply}`,       sub: 'relance prioritaire', color: '#722F37' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>{s.label}</div>
            <div className="font-display text-2xl" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(61,61,61,.5)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* RSVP Progress */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Objectif RSVP</div>
          <div className="font-display text-2xl text-[#F7E9CF]">{confirmed} <span className="text-base font-normal" style={{ color: 'rgba(247,233,207,.6)' }}>/ 450</span></div>
        </div>
        <div className="h-3 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.round(confirmed/450*100)}%`, background: 'linear-gradient(90deg, #D4A574, #F7E9CF)' }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Mariée', val: guests.filter(g => g.side === 'Mariée' && g.status === 'Confirmé').length },
            { label: 'Marié',  val: guests.filter(g => g.side === 'Marié'  && g.status === 'Confirmé').length },
            { label: 'Enfants', val: 14 },
          ].map(s => (
            <div key={s.label} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,.1)' }}>
              <div className="font-display text-xl text-[#F7E9CF]">{s.val}</div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.8)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-5 border-b border-black/8 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inv-tab text-sm flex items-center whitespace-nowrap${tab === t.id ? ' active' : ''}`}>
            {t.label}
            {t.count !== undefined && <span className="ct">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: LISTE ── */}
      {tab === 'list' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl bg-white px-3.5 py-2.5" style={{ outline: '1px solid rgba(61,61,61,.1)' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ color: 'rgba(61,61,61,.4)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="search" placeholder="Rechercher un invité…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#0E2916' }} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['Tous', 'Confirmé', 'En attente', 'Non répondu', 'Décliné'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium transition"
                  style={{
                    background: filter === s ? '#1E5631' : 'white',
                    color:      filter === s ? '#F7E9CF' : 'rgba(61,61,61,.65)',
                    outline:    filter === s ? 'none' : '1px solid rgba(61,61,61,.12)',
                  }}>{s}</button>
              ))}
            </div>
            {(selected.length > 0 || noReply > 0) && (
              <button onClick={sendReminder} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium hover:opacity-90 transition" style={{ background: '#25D366', color: 'white' }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>
                Envoyer rappel WhatsApp {selected.length > 0 ? `(${selected.length})` : `(${noReply} non répondus)`}
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/5 flex items-center justify-between">
              <div className="font-display text-base" style={{ color: '#0E2916' }}>{filtered.length} invité{filtered.length > 1 ? 's' : ''}</div>
              <button onClick={() => toast.info('Import CSV disponible prochainement')} className="inline-flex items-center gap-1.5 text-[12px] font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3v10M6 9l4 4 4-4M4 17h12"/></svg>
                Importer CSV
              </button>
            </div>
            <ul className="divide-y divide-black/5">
              {filtered.map(guest => {
                const sty = STATUS_STYLES[guest.status]
                const isSel = selected.includes(guest.id)
                return (
                  <li key={guest.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAF7F2]/50 transition cursor-pointer ${isSel ? 'bg-[#EAF1EC]/40' : ''}`} onClick={() => toggleSelect(guest.id)}>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full grid place-items-center font-display text-base text-white shrink-0" style={{ background: guest.side === 'Mariée' ? 'linear-gradient(135deg,#722F37,#D4A574)' : 'linear-gradient(135deg,#1E5631,#D4A574)' }}>
                        {guest.name.charAt(0)}
                      </div>
                      {isSel && (
                        <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full grid place-items-center ring-2 ring-white" style={{ background: '#1E5631' }}>
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 6 2.5 2.5 5.5-5"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: '#0E2916' }}>{guest.name}</span>
                        {guest.plus1 && <span className="text-[9px] rounded-full px-1.5 py-0.5" style={{ background: '#EAF1EC', color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>+1</span>}
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.55)' }}>
                        {guest.relation} · {guest.side} · {guest.ceremonies.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                      </div>
                    </div>
                    {guest.table && (
                      <div className="hidden sm:block text-center shrink-0">
                        <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.4)' }}>Table</div>
                        <div className="font-display text-lg" style={{ color: '#0E2916' }}>{guest.table}</div>
                      </div>
                    )}
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0" style={{ background: sty.bg, color: sty.text }}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ background: sty.dot }} />{guest.status}
                    </span>
                    {guest.status !== 'Confirmé' && guest.phone && (
                      <a href={`https://wa.me/${guest.phone.replace(/\s/g, '')}`} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="grid h-8 w-8 place-items-center rounded-lg shrink-0 hover:opacity-80 transition"
                        style={{ background: '#25D366', color: 'white' }}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm" style={{ color: 'rgba(61,61,61,.5)' }}>Aucun invité trouvé avec ce filtre.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: PLAN DE TABLE IA ── */}
      {tab === 'table' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <article className="rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-black/5 shadow-card relative overflow-hidden">
            {aiLoading && (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl" style={{ background: 'rgba(250,247,242,.88)' }}>
                <div className="text-center ai-pulse">
                  <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg, #D4A574, #722F37, #1E5631)' }}>✨</div>
                  <div className="mt-4 font-display text-2xl" style={{ color: '#0E2916' }}>Sama IA réorganise…</div>
                  <div className="mt-1 text-[11px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>{AI_STEPS[aiStep]}</div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Plan de table · réception</div>
                <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>30 tables · 450 places</h3>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(61,61,61,.55)' }}>Sama a évité <strong style={{ color: '#1E5631' }}>5 conflits familiaux</strong> automatiquement.</p>
              </div>
              <button onClick={regenPlan} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4A574, #B98548)', color: '#3D181C', boxShadow: '0 0 0 1px rgba(212,165,116,.4)' }}>
                <span className="grid h-5 w-5 place-items-center rounded-full text-[#F7E9CF] text-xs" style={{ background: '#722F37' }}>✨</span>
                Régénérer le plan
              </button>
            </div>

            <div className="mt-4 flex items-center flex-wrap gap-3 text-[11px]" style={{ color: 'rgba(61,61,61,.65)' }}>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#722F37' }} />VIP</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#1E5631' }} />Famille</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#D4A574' }} />Amis</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'rgba(61,61,61,.3)' }} />Pros / Autres</span>
            </div>

            <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {TABLES.map(t => {
                const s = TABLE_STYLE[t.kind]
                const isOpen = openTable === t.i
                return (
                  <button key={t.i} onClick={() => { setOpenTable(isOpen ? null : t.i); toast(`Table ${t.i} — ${t.lbl} · ${t.seats} places`) }}
                    className={`table-card text-left${isOpen ? ' selected' : ''}`}
                    style={{ background: s.bg, color: s.text, boxShadow: t.kind === 't-pro' || t.kind === 't-other' ? 'inset 0 0 0 1px rgba(61,61,61,.08)' : undefined }}>
                    <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: t.kind === 't-amis' ? 'rgba(61,61,61,.55)' : 'rgba(250,247,242,.65)' }}>T{t.i}</div>
                    <div>
                      <div className="text-[10px] font-medium leading-tight">{t.lbl}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: t.kind === 't-amis' ? 'rgba(61,61,61,.5)' : 'rgba(250,247,242,.55)' }}>{t.seats} places</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </article>

          <aside className="space-y-3 lg:sticky lg:top-20 h-fit">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg text-sm" style={{ background: '#1E5631', color: '#F7E9CF' }}>🧠</span>
                <h3 className="font-display text-lg" style={{ color: '#0E2916' }}>Conflits évités</h3>
              </div>
              <ul className="space-y-2 text-[13px]">
                {[
                  { t: 'Tata Codou ↔ Tata Awa.', d: 'Séparées tables 3 et 11. Sama dit : sage.' },
                  { t: 'Tonton Mansour ↔ Tonton Babacar.', d: 'Tables 6 et 18, séparés par la piste.' },
                  { t: 'Cousines Diop (côté mariée).', d: 'Regroupées table 4 par affinité.' },
                ].map(c => (
                  <li key={c.t} className="rounded-xl p-3 leading-snug" style={{ background: 'rgba(250,247,242,.8)' }}>
                    <strong style={{ color: '#0E2916' }}>{c.t}</strong> <span style={{ color: 'rgba(61,61,61,.65)' }}>{c.d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg text-sm" style={{ background: '#D4A574', color: '#3D181C' }}>📤</span>
                <h3 className="font-display text-lg" style={{ color: '#0E2916' }}>Export</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['PDF', 'Excel'].map(f => (
                  <button key={f} onClick={() => toast.info(`Export ${f} disponible prochainement`)} className="rounded-xl py-2 text-[12px] hover:opacity-75 transition" style={{ background: '#FAF7F2', outline: '1px solid rgba(61,61,61,.08)' }}>{f}</button>
                ))}
                <button onClick={() => toast.info('Impression disponible prochainement')} className="col-span-2 rounded-xl py-2 text-[12px] hover:opacity-75 transition" style={{ background: '#FAF7F2', outline: '1px solid rgba(61,61,61,.08)' }}>Imprimer pour la salle</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── TAB: RSVP RÉCENTS ── */}
      {tab === 'rsvp' && (
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5">
            <h3 className="font-display text-xl" style={{ color: '#0E2916' }}>RSVP récents</h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(61,61,61,.55)' }}>3 nouvelles confirmations dans les 2 dernières heures.</p>
          </div>
          <ul className="divide-y divide-black/5">
            {RSVP_RECENT.map((r, i) => (
              <li key={i} className="px-5 py-4 flex items-center gap-3 hover:bg-[#FAF7F2]/40 transition">
                <span className="text-2xl shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: '#0E2916' }}>{r.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'rgba(61,61,61,.55)' }}>{r.detail}</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0" style={{ background: r.pillStyle.bg, color: r.pillStyle.text }}>{r.pill}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 border-t border-black/5 text-center">
            <button onClick={() => toast.info('Historique complet disponible prochainement')} className="text-[12px] font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>Voir tout l'historique →</button>
          </div>
        </div>
      )}
    </>
  )
}
