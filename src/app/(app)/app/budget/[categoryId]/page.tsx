'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { toast } from 'sonner'

const PAYMENT_ICONS: Record<string, string> = { wave: '💙', orange_money: '🟠', cash: '💵', virement: '🏦', stripe: '💳' }

const schema = z.object({
  description:   z.string().min(2, 'Description requise'),
  amount:        z.string().min(1, 'Montant requis'),
  paymentMethod: z.enum(['wave', 'orange_money', 'cash', 'stripe', 'virement']).optional(),
  notes:         z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CategoryDetailPage() {
  const params     = useParams()
  const categoryId = params.categoryId as string
  const [showForm, setShowForm] = useState(false)

  const { data: wedding }              = trpc.wedding.getMine.useQuery()
  const { data: budget }               = trpc.budget.get.useQuery({ weddingId: wedding?.id ?? '' }, { enabled: !!wedding?.id })
  const { data: items, refetch }       = trpc.budget.getItems.useQuery({ categoryId })
  const addExpense = trpc.budget.addExpense.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); reset(); toast.success('Dépense ajoutée !') },
    onError: e => toast.error(e.message),
  })

  const category   = budget?.categories?.find(c => c.id === categoryId)
  const totalSpent = items?.reduce((s, i) => s + i.amount, 0) ?? 0
  const budgeted   = category?.amountRecommended ?? 0
  const progress   = budgeted > 0 ? Math.round((totalSpent / budgeted) * 100) : 0
  const over       = totalSpent > budgeted

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const selectedMethod = watch('paymentMethod')

  function onSubmit(data: FormData) {
    const amount = parseInt(data.amount.replace(/\s/g, ''))
    if (isNaN(amount) || amount < 100) { toast.error('Montant invalide'); return }
    addExpense.mutate({ categoryId, description: data.description, amount, paymentMethod: data.paymentMethod, notes: data.notes })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Back */}
      <Link href="/app/budget" className="inline-flex items-center gap-1.5 text-sm hover:opacity-75 transition" style={{ color: '#1E5631' }}>
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 10H4M9 5l-5 5 5 5"/></svg>
        Retour au budget
      </Link>

      {/* Category header */}
      {category ? (
        <div className="rounded-2xl p-6 text-[#F7E9CF]" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631)' }}>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama Budget</div>
          <h2 className="font-display text-3xl">{category.name}</h2>
          {category.justification && (
            <p className="mt-2 text-sm italic" style={{ color: 'rgba(247,233,207,.75)' }}>{category.justification}</p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Budget prévu', val: formatFCFA(budgeted) },
              { label: 'Dépensé',      val: formatFCFA(totalSpent), highlight: over },
              { label: 'Restant',      val: formatFCFA(Math.max(0, budgeted - totalSpent)) },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,.1)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.8)' }}>{s.label}</div>
                <div className="font-display text-base" style={{ color: s.highlight ? '#ffb3b3' : '#F7E9CF' }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%`, background: over ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #D4A574, #EFD9B8)' }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(247,233,207,.6)' }}>
            <span>{progress}% utilisé</span>
            {over && <span style={{ color: '#fca5a5' }}>⚠ Dépassement de {formatFCFA(totalSpent - budgeted)}</span>}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center" style={{ outline: '1px solid rgba(61,61,61,.08)' }}>
          <div className="h-8 w-8 rounded-full border-2 border-[#1E5631]/30 border-t-[#1E5631] animate-spin mx-auto" />
          <p className="mt-3 text-sm" style={{ color: 'rgba(61,61,61,.5)' }}>Chargement…</p>
        </div>
      )}

      {/* Tips */}
      {category?.tips && category.tips.length > 0 && (
        <div className="rounded-2xl p-5 ring-1" style={{ background: 'rgba(30,86,49,.05)', outlineColor: 'rgba(30,86,49,.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg shrink-0" style={{ background: '#1E5631', color: '#F7E9CF' }}>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11h.01"/></svg>
            </div>
            <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#1E5631' }}>Conseils Sama IA</div>
          </div>
          <ul className="space-y-1.5">
            {category.tips.map((tip, i) => (
              <li key={i} className="text-[13px] leading-snug" style={{ color: 'rgba(61,61,61,.75)' }}>· {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expenses list */}
      <div className="rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
          <div className="font-display text-lg" style={{ color: '#0E2916' }}>
            Dépenses <span className="font-sans text-base font-normal" style={{ color: 'rgba(61,61,61,.5)' }}>({items?.length ?? 0})</span>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium hover:opacity-90 transition"
            style={{ background: '#1E5631', color: '#F7E9CF' }}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12"/></svg>
            Ajouter
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 border-b border-black/5 space-y-4" style={{ background: '#FAF7F2' }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Description *</label>
                <input {...register('description')} placeholder="Ex: Acompte 50%" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
                {errors.description && <p className="mt-1 text-[11px]" style={{ color: '#722F37' }}>{errors.description.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Montant (FCFA) *</label>
                <input {...register('amount')} placeholder="500 000" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
                {errors.amount && <p className="mt-1 text-[11px]" style={{ color: '#722F37' }}>{errors.amount.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Mode de paiement</label>
              <div className="flex flex-wrap gap-2">
                {(['wave', 'orange_money', 'cash', 'virement'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setValue('paymentMethod', m)}
                    className="rounded-xl border px-3 py-1.5 text-[12px] transition"
                    style={{
                      borderColor: selectedMethod === m ? '#1E5631' : 'rgba(61,61,61,.15)',
                      background: selectedMethod === m ? '#EAF1EC' : 'white',
                      color: selectedMethod === m ? '#1E5631' : '#3D3D3D',
                    }}
                  >
                    {PAYMENT_ICONS[m]} {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>Notes (optionnel)</label>
              <input {...register('notes')} placeholder="Références, précisions…" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631]" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }} />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={addExpense.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#1E5631', color: '#F7E9CF' }}>
                {addExpense.isPending ? 'Enregistrement…' : 'Enregistrer la dépense'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm border hover:bg-[#FAF7F2] transition" style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {!items?.length && !showForm && (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-display text-xl mb-1" style={{ color: '#0E2916' }}>Aucune dépense</div>
            <p className="text-sm mb-5" style={{ color: 'rgba(61,61,61,.55)' }}>Commence à tracker ce poste dès maintenant.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition" style={{ background: '#1E5631', color: '#F7E9CF' }}>
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12"/></svg>
              Ajouter la première dépense
            </button>
          </div>
        )}

        {/* Items list */}
        <ul className="divide-y divide-black/5">
          {items?.map(item => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAF7F2]/50 transition">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg" style={{ background: '#F4E4C1' }}>
                {item.paymentMethod ? PAYMENT_ICONS[item.paymentMethod] : '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#0E2916' }}>{item.description}</div>
                <div className="text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.5)' }}>
                  {item.paymentMethod?.replace('_', ' ') ?? 'Non spécifié'}
                  {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString('fr-FR')}`}
                </div>
              </div>
              <div className="font-medium shrink-0" style={{ fontFamily: 'var(--font-jetbrains)', color: '#0E2916' }}>
                {formatFCFA(item.amount)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
