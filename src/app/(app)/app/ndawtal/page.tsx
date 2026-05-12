'use client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'reçus' | 'obligations'

const CEREMONY_LABELS: Record<string, string> = { takk: 'Takk', ceet: 'Ceet', civil: 'Civil', reception: 'Réception' }
const RELATIONSHIP_LABELS: Record<string, string> = {
  tante: 'Tante', cousine: 'Cousine', amie: 'Amie', voisine: 'Voisine',
  collegue: 'Collègue', famille_marie: 'Famille marié', autre: 'Autre',
}
const TYPE_ICONS: Record<string, string> = { cash: '💵', cadeau: '🎁', service: '🤝' }

export default function NdawtalPage() {
  const [tab, setTab]         = useState<Tab>('reçus')
  const [message, setMessage] = useState('')
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<{
    donor_name: string; amount_fcfa: number | null; type: 'cash' | 'cadeau' | 'service'
    gift_description: string | null; confidence: number; needs_clarification: boolean; clarification_question: string | null
  } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({
    donorName: '', donorPhone: '', relationship: 'amie' as const, familySide: 'mariee' as const,
    type: 'cash' as 'cash' | 'cadeau' | 'service', amountFcfa: '', giftDescription: '', ceremony: 'reception' as const, notes: '',
  })

  const { data: wedding }                          = trpc.wedding.getMine.useQuery()
  const weddingId                                  = wedding?.id ?? ''
  const { data: records, refetch: refetchRecords } = trpc.ndawtal.list.useQuery({ weddingId }, { enabled: !!weddingId })
  const { data: stats, refetch: refetchStats }     = trpc.ndawtal.stats.useQuery({ weddingId }, { enabled: !!weddingId })
  const { data: obligations, refetch: refetchObl } = trpc.ndawtal.listObligations.useQuery({ weddingId }, { enabled: !!weddingId })

  const parseAndPreview = trpc.ndawtal.parseAndPreview.useMutation({
    onSuccess: d => { setPreview(d); setParsing(false) },
    onError: e => { toast.error(e.message); setParsing(false) },
  })
  const addRecord = trpc.ndawtal.add.useMutation({
    onSuccess: () => {
      toast.success('Don enregistré ✓')
      setPreview(null); setMessage(''); setShowManual(false)
      setManual({ donorName: '', donorPhone: '', relationship: 'amie', familySide: 'mariee', type: 'cash', amountFcfa: '', giftDescription: '', ceremony: 'reception', notes: '' })
      refetchRecords(); refetchStats(); refetchObl()
    },
    onError: e => toast.error(e.message),
  })
  const markReceipt  = trpc.ndawtal.markReceiptSent.useMutation({ onSuccess: () => { toast.success('Reçu marqué envoyé'); refetchRecords() } })
  const deleteRecord = trpc.ndawtal.delete.useMutation({ onSuccess: () => { toast.success('Supprimé'); refetchRecords(); refetchStats(); refetchObl() } })
  const markReturned = trpc.ndawtal.markObligationReturned.useMutation({ onSuccess: () => { toast.success('Obligation soldée ✓'); refetchObl(); refetchStats() } })

  function handleParse() {
    if (!message.trim() || !weddingId) return
    setParsing(true)
    parseAndPreview.mutate({ weddingId, message: message.trim() })
  }
  function confirmPreview() {
    if (!preview || !weddingId) return
    addRecord.mutate({ weddingId, donorName: preview.donor_name, type: preview.type, amountFcfa: preview.amount_fcfa ?? undefined, giftDescription: preview.gift_description ?? undefined, ceremony: 'reception', aiConfidence: preview.confidence, createObligation: preview.type === 'cash' })
  }
  function handleManualAdd() {
    if (!weddingId || !manual.donorName.trim()) return
    const amount = manual.type === 'cash' ? parseInt(manual.amountFcfa.replace(/\s/g, '')) : undefined
    if (manual.type === 'cash' && (!amount || isNaN(amount))) { toast.error('Montant invalide'); return }
    addRecord.mutate({ weddingId, donorName: manual.donorName, donorPhone: manual.donorPhone || undefined, relationship: manual.relationship, familySide: manual.familySide, type: manual.type, amountFcfa: amount, giftDescription: manual.giftDescription || undefined, ceremony: manual.ceremony, notes: manual.notes || undefined, createObligation: manual.type === 'cash' })
  }

  const totalCollected = stats?.totalCollected ?? 0
  const donorCount     = stats?.donorCount ?? 0
  const totalObl       = stats?.totalObligations ?? 0
  const pendingObl     = obligations?.filter(o => !o.isReturned).length ?? 0

  return (
    <>
      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-3xl text-[#F7E9CF] p-6 sm:p-8 mb-6 shadow-glow" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37, #0E2916)' }}>
        <div className="absolute inset-0 wax-bg opacity-30" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.18)' }} />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full blur-2xl" style={{ background: 'rgba(30,86,49,.3)' }} />

        <div className="relative grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4" style={{ background: 'rgba(212,165,116,.15)', border: '1px solid rgba(212,165,116,.25)' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }} />
              <span className="text-[10px] uppercase tracking-[.2em]" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama Ndawtal · Live</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.05]">
              {totalCollected > 0
                ? <>{(totalCollected / 1000).toFixed(0)}<span className="text-2xl font-normal" style={{ color: '#D4A574' }}> 000 FCFA</span></>
                : <span className="italic" style={{ color: '#D4A574' }}>Le premier don</span>}
            </h2>
            {totalCollected > 0 && <p className="mt-2 text-sm" style={{ color: 'rgba(247,233,207,.75)' }}>{donorCount} donateur{donorCount > 1 ? 's' : ''} enregistré{donorCount > 1 ? 's' : ''}</p>}
            {totalCollected === 0 && <p className="mt-2 text-sm" style={{ color: 'rgba(247,233,207,.75)' }}>sera celui qui lance le mouvement. Prépare-toi.</p>}
          </div>

          <div className="lg:col-span-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Total reçu',  val: totalCollected > 0 ? formatFCFA(totalCollected) : '—', sub: 'en dons cash', color: '#D4A574' },
              { label: 'Donateurs',   val: String(donorCount || '—'), sub: 'familles & amis', color: '#F7E9CF' },
              { label: 'À rendre',    val: totalObl > 0 ? formatFCFA(totalObl) : '—', sub: `${pendingObl} obligation${pendingObl > 1 ? 's' : ''}`, color: pendingObl > 0 ? '#ffb3b3' : '#F7E9CF' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl backdrop-blur p-3 text-center ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.7)' }}>{s.label}</div>
                <div className="font-display text-xl leading-tight" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(247,233,207,.5)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK ADD ── */}
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl shrink-0" style={{ background: '#FBF4EA' }}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" style={{ color: '#B98548' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 0 4h-1v1a5 5 0 0 1-10 0v-1H4a2 2 0 0 1 0-4h1V7a5 5 0 0 1 5-5z"/></svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Sama IA</div>
            <div className="font-display text-lg" style={{ color: '#0E2916' }}>Ajouter rapidement</div>
          </div>
        </div>

        <p className="text-[12px] mb-3" style={{ color: 'rgba(61,61,61,.55)' }}>
          Tape en langage naturel → l&apos;IA comprend tout.
          <span className="ml-1.5 font-medium" style={{ color: '#B98548' }}>Ex: &ldquo;Tata Bineta 50k&rdquo; · &ldquo;1 sac de riz de Fatou&rdquo;</span>
        </p>

        <div className="flex gap-2">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleParse()}
            placeholder="Tape le don ici…"
            className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#1E5631]"
            style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}
          />
          <button
            onClick={handleParse}
            disabled={!message.trim() || parsing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            style={{ background: '#1E5631', color: '#F7E9CF' }}
          >
            {parsing
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>Analyser</>}
          </button>
        </div>

        {/* AI Preview */}
        {preview && (
          <div className="mt-4 rounded-2xl p-4 ring-1" style={{ background: 'rgba(212,165,116,.06)', outlineColor: 'rgba(212,165,116,.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-full" style={{ background: '#D4A574', color: '#3D181C' }}>
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m1.5 6 3 3 6-6"/></svg>
              </div>
              <span className="text-[12px] font-medium" style={{ color: '#B98548' }}>Sama IA a compris :</span>
              <span className="ml-auto text-[11px] rounded-full px-2 py-0.5" style={{ background: preview.confidence >= 0.8 ? '#EAF1EC' : 'rgba(114,47,55,.1)', color: preview.confidence >= 0.8 ? '#1E5631' : '#722F37', fontFamily: 'var(--font-jetbrains)' }}>
                {Math.round(preview.confidence * 100)}% confiance
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="rounded-xl p-2.5 text-center" style={{ background: 'white', outline: '1px solid rgba(61,61,61,.07)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.4)' }}>Nom</div>
                <div className="font-medium text-sm" style={{ color: '#0E2916' }}>{preview.donor_name}</div>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: 'white', outline: '1px solid rgba(61,61,61,.07)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.4)' }}>Type</div>
                <div className="font-medium text-sm" style={{ color: '#0E2916' }}>{TYPE_ICONS[preview.type]} {preview.type}</div>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: 'white', outline: '1px solid rgba(61,61,61,.07)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.4)' }}>Montant</div>
                <div className="font-medium text-sm" style={{ color: preview.amount_fcfa ? '#1E5631' : '#3D3D3D' }}>
                  {preview.amount_fcfa ? formatFCFA(preview.amount_fcfa) : preview.gift_description ?? '—'}
                </div>
              </div>
            </div>
            {preview.needs_clarification && preview.clarification_question && (
              <p className="mb-3 text-[11px] rounded-lg p-2" style={{ background: 'rgba(212,165,116,.1)', color: '#B98548' }}>⚠ {preview.clarification_question}</p>
            )}
            <div className="flex gap-2">
              <button onClick={confirmPreview} disabled={addRecord.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#1E5631', color: '#F7E9CF' }}>
                {addRecord.isPending ? 'Enregistrement…' : '✓ Confirmer le don'}
              </button>
              <button onClick={() => setPreview(null)} className="rounded-xl px-4 py-2.5 text-sm border hover:bg-[#FAF7F2] transition" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setShowManual(v => !v)} className="mt-3 text-[12px] hover:underline transition" style={{ color: 'rgba(61,61,61,.5)' }}>
          {showManual ? '− Masquer le formulaire manuel' : '+ Ajouter manuellement'}
        </button>

        {/* Manual form */}
        {showManual && (
          <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Nom *</label>
                <input value={manual.donorName} onChange={e => setManual(m => ({ ...m, donorName: e.target.value }))} placeholder="Tata Bineta" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Téléphone</label>
                <input value={manual.donorPhone} onChange={e => setManual(m => ({ ...m, donorPhone: e.target.value }))} placeholder="+221 77…" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Type</label>
                <select value={manual.type} onChange={e => setManual(m => ({ ...m, type: e.target.value as typeof manual.type }))} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}>
                  <option value="cash">💵 Cash</option><option value="cadeau">🎁 Cadeau</option><option value="service">🤝 Service</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Cérémonie</label>
                <select value={manual.ceremony} onChange={e => setManual(m => ({ ...m, ceremony: e.target.value as typeof manual.ceremony }))} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}>
                  <option value="reception">Réception</option><option value="takk">Takk</option><option value="ceet">Ceet</option><option value="civil">Civil</option>
                </select>
              </div>
            </div>
            {manual.type === 'cash' ? (
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Montant (FCFA) *</label>
                <input value={manual.amountFcfa} onChange={e => setManual(m => ({ ...m, amountFcfa: e.target.value }))} placeholder="50 000" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Description du cadeau</label>
                <input value={manual.giftDescription} onChange={e => setManual(m => ({ ...m, giftDescription: e.target.value }))} placeholder="1 sac de riz basmati" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Relation</label>
                <select value={manual.relationship} onChange={e => setManual(m => ({ ...m, relationship: e.target.value as typeof manual.relationship }))} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}>
                  {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Côté famille</label>
                <select value={manual.familySide} onChange={e => setManual(m => ({ ...m, familySide: e.target.value as typeof manual.familySide }))} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}>
                  <option value="mariee">Mariée</option><option value="marie">Marié</option><option value="les_deux">Les deux</option>
                </select>
              </div>
            </div>
            <button onClick={handleManualAdd} disabled={addRecord.isPending} className="w-full rounded-xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#1E5631', color: '#F7E9CF' }}>
              {addRecord.isPending ? 'Enregistrement…' : 'Enregistrer le don'}
            </button>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-4 w-fit" style={{ background: 'rgba(61,61,61,.06)' }}>
        {(['reçus', 'obligations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-5 py-2 text-[13px] font-medium transition"
            style={{ background: tab === t ? 'white' : 'transparent', color: tab === t ? '#0E2916' : 'rgba(61,61,61,.55)', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}
          >
            {t === 'reçus'
              ? `🎁 Dons reçus (${records?.length ?? 0})`
              : `🔄 Obligations (${pendingObl})`}
          </button>
        ))}
      </div>

      {/* ── RECORDS TAB ── */}
      {tab === 'reçus' && (
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
          {!records || records.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">🎁</div>
              <div className="font-display text-xl mb-2" style={{ color: '#0E2916' }}>Aucun don enregistré</div>
              <p className="text-sm mb-5" style={{ color: 'rgba(61,61,61,.55)' }}>Commence en tapant le premier don ci-dessus.</p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {records.map(r => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAF7F2]/50 transition">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: r.type === 'cash' ? '#EAF1EC' : '#FBF4EA' }}>
                    {TYPE_ICONS[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: '#0E2916' }}>{r.donorName}</span>
                      <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: '#EAF1EC', color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>{CEREMONY_LABELS[r.ceremony]}</span>
                      {r.relationship && <span className="text-[10px]" style={{ color: 'rgba(61,61,61,.45)' }}>{RELATIONSHIP_LABELS[r.relationship] ?? r.relationship}</span>}
                      {r.aiConfidence && r.aiConfidence < 0.7 && <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: 'rgba(212,165,116,.15)', color: '#B98548', fontFamily: 'var(--font-jetbrains)' }}>⚠ {Math.round(r.aiConfidence * 100)}%</span>}
                    </div>
                    {r.type === 'cash' && r.amountFcfa ? (
                      <div className="font-medium text-sm mt-0.5" style={{ color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>{formatFCFA(r.amountFcfa)}</div>
                    ) : (
                      <div className="text-sm mt-0.5 italic" style={{ color: 'rgba(61,61,61,.55)' }}>{r.giftDescription ?? 'Cadeau / service'}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!r.receiptSent ? (
                      <button onClick={() => markReceipt.mutate({ id: r.id })} className="rounded-lg border px-2 py-1.5 text-[11px] hover:bg-[#EAF1EC] transition" style={{ borderColor: '#D4A574', color: '#B98548' }} title="Envoyer reçu">📨</button>
                    ) : (
                      <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: '#EAF1EC', color: '#1E5631', fontFamily: 'var(--font-jetbrains)' }}>✓ Reçu</span>
                    )}
                    <button onClick={() => deleteRecord.mutate({ id: r.id })} className="grid h-7 w-7 place-items-center rounded-lg border hover:border-red-200 hover:bg-red-50 hover:text-red-400 transition" style={{ borderColor: 'rgba(61,61,61,.12)', color: 'rgba(61,61,61,.35)' }}>
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── OBLIGATIONS TAB ── */}
      {tab === 'obligations' && (
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
          {!obligations || obligations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <div className="font-display text-xl mb-2" style={{ color: '#0E2916' }}>Aucune obligation</div>
              <p className="text-sm" style={{ color: 'rgba(61,61,61,.55)' }}>Les retours de ndawtal apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {obligations.map(o => (
                <li key={o.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAF7F2]/50 transition ${o.isReturned ? 'opacity-50' : ''}`}>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: o.isReturned ? '#EAF1EC' : 'rgba(114,47,55,.1)' }}>
                    {o.isReturned ? '✅' : '🔄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: '#0E2916' }}>{o.donorName}</div>
                    {o.amountOwed && (
                      <div className="text-sm mt-0.5 font-medium" style={{ fontFamily: 'var(--font-jetbrains)', color: o.isReturned ? '#1E5631' : '#722F37' }}>
                        {o.isReturned ? `✓ Rendu : ${formatFCFA(o.returnedAmount ?? o.amountOwed)}` : `À rendre : ${formatFCFA(o.amountOwed)}`}
                      </div>
                    )}
                    {o.donorPhone && <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.45)' }}>{o.donorPhone}</div>}
                  </div>
                  {!o.isReturned && (
                    <button onClick={() => markReturned.mutate({ id: o.id, returnedAmount: o.amountOwed ?? 0 })} className="rounded-xl px-3 py-1.5 text-[12px] font-medium border hover:bg-[#EAF1EC] transition shrink-0" style={{ borderColor: '#1E5631', color: '#1E5631' }}>
                      Solder
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
