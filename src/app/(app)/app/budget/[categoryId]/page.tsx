'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

const expenseSchema = z.object({
  description: z.string().min(2, 'Description requise'),
  amount: z.string().min(1, 'Montant requis'),
  paymentMethod: z.enum(['wave', 'orange_money', 'cash', 'stripe', 'virement']).optional(),
  notes: z.string().optional(),
})

type ExpenseForm = z.infer<typeof expenseSchema>

const PAYMENT_METHODS = [
  { id: 'wave', label: '💙 Wave', color: 'bg-blue-50 border-blue-200' },
  { id: 'orange_money', label: '🟠 Orange Money', color: 'bg-orange-50 border-orange-200' },
  { id: 'cash', label: '💵 Cash', color: 'bg-green-50 border-green-200' },
  { id: 'virement', label: '🏦 Virement', color: 'bg-gray-50 border-gray-200' },
]

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string
  const [showForm, setShowForm] = useState(false)

  const { data: items, refetch } = trpc.budget.getItems.useQuery({ categoryId })
  const addExpense = trpc.budget.addExpense.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); reset(); toast.success('Dépense ajoutée !') },
    onError: (e) => toast.error(e.message),
  })

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const { data: budget } = trpc.budget.get.useQuery(
    { weddingId: wedding?.id ?? '' },
    { enabled: !!wedding?.id }
  )

  const category = budget?.categories?.find(c => c.id === categoryId)
  const totalSpent = items?.reduce((s, i) => s + i.amount, 0) ?? 0
  const progress = category ? Math.round((totalSpent / category.amountRecommended) * 100) : 0

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
  })

  const selectedMethod = watch('paymentMethod')

  function onSubmit(data: ExpenseForm) {
    const amount = parseInt(data.amount.replace(/\s/g, ''))
    if (isNaN(amount) || amount < 100) { toast.error('Montant invalide'); return }
    addExpense.mutate({ categoryId, description: data.description, amount, paymentMethod: data.paymentMethod, notes: data.notes })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        ← Retour au budget
      </button>

      {category && (
        <>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
              {category.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1 italic">{category.justification}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Prévu', value: formatFCFA(category.amountRecommended) },
              { label: 'Dépensé', value: formatFCFA(totalSpent), bold: true },
              { label: 'Restant', value: formatFCFA(Math.max(0, category.amountRecommended - totalSpent)) },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={`text-sm font-${s.bold ? 'bold' : 'medium'} mt-1`} style={{ color: '#1E5631' }}>
                    {s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Progress value={progress}
            className={progress > 100 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-700'} />

          {/* Tips */}
          {category.tips && category.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">💡 Conseils IA</p>
              <ul className="space-y-1">
                {category.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-amber-700">• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Expenses list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Dépenses ({items?.length ?? 0})</CardTitle>
            <Button size="sm" onClick={() => setShowForm(v => !v)} style={{ background: '#1E5631' }}>
              + Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add expense form */}
          {showForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="border rounded-xl p-4 mb-4 space-y-4 bg-gray-50">
              <div className="space-y-1">
                <Label>Description</Label>
                <Input placeholder="Ex: Acompte photographe" {...register('description')} />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Montant (FCFA)</Label>
                <Input placeholder="Ex: 500 000" {...register('amount')} />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} type="button"
                      onClick={() => setValue('paymentMethod', m.id as ExpenseForm['paymentMethod'])}
                      className={`p-2 rounded-lg border text-sm text-left transition-all ${
                        selectedMethod === m.id ? 'border-green-600 bg-green-50' : m.color
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes (optionnel)</Label>
                <Input placeholder="Référence, précisions..." {...register('notes')} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addExpense.isPending} className="flex-1" style={{ background: '#1E5631' }}>
                  {addExpense.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </form>
          )}

          {/* List */}
          {items?.length === 0 && !showForm && (
            <p className="text-center text-gray-400 py-6 text-sm">Aucune dépense pour l&apos;instant</p>
          )}
          <div className="space-y-2">
            {items?.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  {item.paymentMethod && (
                    <p className="text-xs text-gray-400 capitalize">{item.paymentMethod.replace('_', ' ')}</p>
                  )}
                </div>
                <p className="font-semibold text-sm" style={{ color: '#1E5631' }}>
                  {formatFCFA(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
