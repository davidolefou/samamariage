'use client'
import { useState } from 'react'
import { toast } from 'sonner'

type RSVPStatus = 'Confirmé' | 'En attente' | 'Décliné' | 'Non répondu'
type CeremonyKey = 'takk' | 'ceet' | 'reception'

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

export default function InvitesPage() {
  const [guests, setGuests] = useState<Guest[]>(GUESTS)
  const [filter, setFilter] = useState<RSVPStatus | 'Tous'>('Tous')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const confirmed  = guests.filter(g => g.status === 'Confirmé').length
  const waiting    = guests.filter(g => g.status === 'En attente').length
  const noReply    = guests.filter(g => g.status === 'Non répondu').length

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

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total invités',  val: `${guests.length}`, sub: 'sur 450 attendus', color: '#1E5631' },
          { label: 'Confirmés',      val: `${confirmed}`,     sub: `${Math.round(confirmed/450*100)}% du total`, color: '#1E5631' },
          { label: 'En attente',     val: `${waiting}`,       sub: 'ont besoin d\'un rappel', color: '#B98548' },
          { label: 'Non répondus',   val: `${noReply}`,       sub: 'relance prioritaire', color: '#722F37' },
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

      {/* Toolbar */}
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
          <button
            onClick={sendReminder}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium hover:opacity-90 transition"
            style={{ background: '#25D366', color: 'white' }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>
            Envoyer rappel WhatsApp {selected.length > 0 ? `(${selected.length})` : `(${noReply} non répondus)`}
          </button>
        )}
      </div>

      {/* Guest list */}
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
            const style = STATUS_STYLES[guest.status]
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
                <span className="rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0" style={{ background: style.bg, color: style.text }}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ background: style.dot }} />{guest.status}
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
  )
}
