'use client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

type Tab = 'reçus' | 'obligations'

const CEREMONY_LABELS: Record<string, string> = {
  takk: 'Takk',
  ceet: 'Ceet',
  civil: 'Civil',
  reception: 'Réception',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  tante: 'Tante',
  cousine: 'Cousine',
  amie: 'Amie',
  voisine: 'Voisine',
  collegue: 'Collègue',
  famille_marie: 'Famille marié',
  autre: 'Autre',
}

export default function NdawtalPage() {
  const [tab, setTab] = useState<Tab>('reçus')
  const [message, setMessage] = useState('')
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<{
    donor_name: string
    amount_fcfa: number | null
    type: 'cash' | 'cadeau' | 'service'
    gift_description: string | null
    confidence: number
    needs_clarification: boolean
    clarification_question: string | null
  } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({
    donorName: '',
    donorPhone: '',
    relationship: 'amie' as const,
    familySide: 'mariee' as const,
    type: 'cash' as const,
    amountFcfa: '',
    giftDescription: '',
    ceremony: 'reception' as const,
    notes: '',
  })

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const weddingId = wedding?.id ?? ''

  const { data: records, refetch: refetchRecords } = trpc.ndawtal.list.useQuery(
    { weddingId },
    { enabled: !!weddingId },
  )
  const { data: stats, refetch: refetchStats } = trpc.ndawtal.stats.useQuery(
    { weddingId },
    { enabled: !!weddingId },
  )
  const { data: obligations, refetch: refetchObligations } = trpc.ndawtal.listObligations.useQuery(
    { weddingId },
    { enabled: !!weddingId },
  )

  const parseAndPreview = trpc.ndawtal.parseAndPreview.useMutation({
    onSuccess: (data) => { setPreview(data); setParsing(false) },
    onError: (e) => { toast.error(e.message); setParsing(false) },
  })

  const addRecord = trpc.ndawtal.add.useMutation({
    onSuccess: () => {
      toast.success('Don enregistré ✓')
      setPreview(null)
      setMessage('')
      setShowManual(false)
      setManual({ donorName: '', donorPhone: '', relationship: 'amie', familySide: 'mariee', type: 'cash', amountFcfa: '', giftDescription: '', ceremony: 'reception', notes: '' })
      refetchRecords()
      refetchStats()
      refetchObligations()
    },
    onError: (e) => toast.error(e.message),
  })

  const markReceipt = trpc.ndawtal.markReceiptSent.useMutation({
    onSuccess: () => { toast.success('Reçu marqué envoyé'); refetchRecords() },
  })

  const deleteRecord = trpc.ndawtal.delete.useMutation({
    onSuccess: () => { toast.success('Supprimé'); refetchRecords(); refetchStats(); refetchObligations() },
  })

  const markReturned = trpc.ndawtal.markObligationReturned.useMutation({
    onSuccess: () => { toast.success('Obligation soldée ✓'); refetchObligations(); refetchStats() },
  })

  function handleParse() {
    if (!message.trim() || !weddingId) return
    setParsing(true)
    parseAndPreview.mutate({ weddingId, message: message.trim() })
  }

  function confirmPreview() {
    if (!preview || !weddingId) return
    addRecord.mutate({
      weddingId,
      donorName: preview.donor_name,
      type: preview.type,
      amountFcfa: preview.amount_fcfa ?? undefined,
      giftDescription: preview.gift_description ?? undefined,
      ceremony: 'reception',
      aiConfidence: preview.confidence,
      createObligation: preview.type === 'cash',
    })
  }

  function handleManualAdd() {
    if (!weddingId || !manual.donorName.trim()) return
    const amount = manual.type === 'cash' ? parseInt(manual.amountFcfa.replace(/\s/g, '')) : undefined
    if (manual.type === 'cash' && (!amount || isNaN(amount))) {
      toast.error('Montant invalide')
      return
    }
    addRecord.mutate({
      weddingId,
      donorName: manual.donorName,
      donorPhone: manual.donorPhone || undefined,
      relationship: manual.relationship,
      familySide: manual.familySide,
      type: manual.type,
      amountFcfa: amount,
      giftDescription: manual.giftDescription || undefined,
      ceremony: manual.ceremony,
      notes: manual.notes || undefined,
      createObligation: manual.type === 'cash',
    })
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
          🎁 Sama Ndawtal
        </h1>
        <p className="text-gray-500 text-sm">Enregistre et suis les dons de ton mariage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total reçu', value: formatFCFA(stats?.totalCollected ?? 0), color: '#1E5631' },
          { label: 'Donateurs', value: String(stats?.donorCount ?? 0), color: '#D4A574' },
          { label: 'À rendre', value: formatFCFA(stats?.totalObligations ?? 0), color: '#722F37' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Quick Add */}
      <Card style={{ border: '1px solid #D4A574' }}>
        <CardContent className="py-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#1E5631' }}>
            ✨ Ajouter rapidement
          </p>
          <p className="text-xs text-gray-400">
            Ex: &ldquo;Tata Bineta 50k&rdquo; • &ldquo;Khadija Diop 100 000&rdquo; • &ldquo;1 sac de riz de Fatou&rdquo;
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Tape le don..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleParse()}
              className="flex-1"
            />
            <Button
              onClick={handleParse}
              disabled={!message.trim() || parsing}
              style={{ background: '#1E5631' }}
            >
              {parsing ? '...' : '→'}
            </Button>
          </div>

          {/* AI Preview */}
          {preview && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#f8f6f2', border: '1px solid #D4A574' }}>
              <p className="text-sm font-medium" style={{ color: '#3D3D3D' }}>
                L&apos;IA a compris :
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-semibold">{preview.donor_name}</span>
                </div>
                {preview.type === 'cash' && preview.amount_fcfa && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant</span>
                    <span className="font-semibold" style={{ color: '#1E5631' }}>
                      {formatFCFA(preview.amount_fcfa)}
                    </span>
                  </div>
                )}
                {preview.type !== 'cash' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cadeau</span>
                    <span className="font-semibold">{preview.gift_description ?? 'Cadeau'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Confiance</span>
                  <span className="text-xs" style={{ color: preview.confidence >= 0.8 ? '#1E5631' : '#722F37' }}>
                    {Math.round(preview.confidence * 100)}%
                  </span>
                </div>
              </div>
              {preview.needs_clarification && preview.clarification_question && (
                <p className="text-xs text-amber-600">⚠️ {preview.clarification_question}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmPreview} disabled={addRecord.isPending}
                  style={{ background: '#1E5631', flex: 1 }}>
                  {addRecord.isPending ? 'Enregistrement...' : 'Confirmer ✓'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreview(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          <button
            className="text-xs text-gray-400 underline underline-offset-2"
            onClick={() => setShowManual(v => !v)}
          >
            {showManual ? 'Masquer formulaire manuel' : 'Ou ajouter manuellement'}
          </button>
        </CardContent>
      </Card>

      {/* Manual Add Form */}
      {showManual && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold" style={{ color: '#1E5631' }}>Ajout manuel</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nom *</label>
                <Input value={manual.donorName} onChange={e => setManual(m => ({ ...m, donorName: e.target.value }))} placeholder="Tata Bineta" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Téléphone</label>
                <Input value={manual.donorPhone} onChange={e => setManual(m => ({ ...m, donorPhone: e.target.value }))} placeholder="+221 77..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2"
                  value={manual.type}
                  onChange={e => setManual(m => ({ ...m, type: e.target.value as typeof manual.type }))}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="cadeau">🎁 Cadeau</option>
                  <option value="service">🤝 Service</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cérémonie</label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2"
                  value={manual.ceremony}
                  onChange={e => setManual(m => ({ ...m, ceremony: e.target.value as typeof manual.ceremony }))}
                >
                  <option value="reception">Réception</option>
                  <option value="takk">Takk</option>
                  <option value="ceet">Ceet</option>
                  <option value="civil">Civil</option>
                </select>
              </div>
            </div>
            {manual.type === 'cash' ? (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Montant (FCFA) *</label>
                <Input value={manual.amountFcfa} onChange={e => setManual(m => ({ ...m, amountFcfa: e.target.value }))} placeholder="50 000" />
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description du cadeau</label>
                <Input value={manual.giftDescription} onChange={e => setManual(m => ({ ...m, giftDescription: e.target.value }))} placeholder="1 sac de riz basmati" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Relation</label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2"
                  value={manual.relationship}
                  onChange={e => setManual(m => ({ ...m, relationship: e.target.value as typeof manual.relationship }))}
                >
                  {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Côté</label>
                <select
                  className="w-full text-sm border rounded-md px-3 py-2"
                  value={manual.familySide}
                  onChange={e => setManual(m => ({ ...m, familySide: e.target.value as typeof manual.familySide }))}
                >
                  <option value="mariee">Mariée</option>
                  <option value="marie">Marié</option>
                  <option value="les_deux">Les deux</option>
                </select>
              </div>
            </div>
            <Button onClick={handleManualAdd} disabled={addRecord.isPending} className="w-full" style={{ background: '#1E5631' }}>
              {addRecord.isPending ? 'Enregistrement...' : 'Enregistrer le don'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#f0ece4' }}>
        {(['reçus', 'obligations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize"
            style={tab === t
              ? { background: '#fff', color: '#1E5631', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
              : { color: '#737373' }}
          >
            {t === 'reçus' ? `🎁 Reçus (${records?.length ?? 0})` : `🔄 Obligations (${obligations?.filter(o => !o.isReturned).length ?? 0})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'reçus' && (
        <div className="space-y-2">
          {!records || records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-sm">Aucun don enregistré pour l&apos;instant</p>
              <p className="text-xs mt-1">Tape un don en haut pour commencer</p>
            </div>
          ) : (
            records.map(r => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{r.donorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EAF1EC', color: '#1E5631' }}>
                          {CEREMONY_LABELS[r.ceremony]}
                        </span>
                        {r.aiConfidence && r.aiConfidence < 0.7 && (
                          <span className="text-xs text-amber-500">⚠️ faible confiance</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {r.type === 'cash' && r.amountFcfa ? (
                          <span className="text-sm font-bold" style={{ color: '#1E5631' }}>
                            {formatFCFA(r.amountFcfa)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            {r.giftDescription ?? 'Cadeau / service'}
                          </span>
                        )}
                        {r.relationship && (
                          <span className="text-xs text-gray-400">{RELATIONSHIP_LABELS[r.relationship]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!r.receiptSent ? (
                        <button
                          onClick={() => markReceipt.mutate({ id: r.id })}
                          className="text-xs px-2 py-1 rounded-md border transition-colors hover:bg-green-50"
                          style={{ borderColor: '#D4A574', color: '#B98548' }}
                          title="Marquer reçu envoyé"
                        >
                          📨
                        </button>
                      ) : (
                        <span className="text-xs text-green-600" title="Reçu envoyé">✓</span>
                      )}
                      <button
                        onClick={() => deleteRecord.mutate({ id: r.id })}
                        className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'obligations' && (
        <div className="space-y-2">
          {!obligations || obligations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-sm">Aucune obligation de retour pour l&apos;instant</p>
            </div>
          ) : (
            obligations.map(o => (
              <Card key={o.id} style={{ opacity: o.isReturned ? 0.5 : 1 }}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{o.donorName}</span>
                        {o.isReturned && <span className="text-xs text-green-600">✓ Soldé</span>}
                      </div>
                      {o.amountOwed && (
                        <p className="text-sm mt-0.5" style={{ color: o.isReturned ? '#737373' : '#722F37' }}>
                          {o.isReturned
                            ? `Rendu : ${formatFCFA(o.returnedAmount ?? o.amountOwed)}`
                            : `À rendre : ${formatFCFA(o.amountOwed)}`}
                        </p>
                      )}
                      {o.donorPhone && <p className="text-xs text-gray-400">{o.donorPhone}</p>}
                    </div>
                    {!o.isReturned && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markReturned.mutate({ id: o.id, returnedAmount: o.amountOwed ?? 0 })}
                        style={{ borderColor: '#1E5631', color: '#1E5631', fontSize: '11px' }}
                      >
                        Marquer soldé
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
