'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const COLORS = ['#1E5631','#2d7a47','#D4A574','#722F37','#4a9e68','#e8c49a','#a85565','#6bc285','#f0d4b0','#c97a88']

export default function BudgetPage() {
  const router = useRouter()
  const [budgetInput, setBudgetInput] = useState('')
  const [generating, setGenerating] = useState(false)

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const { data: budget, refetch } = trpc.budget.get.useQuery(
    { weddingId: wedding?.id ?? '' },
    { enabled: !!wedding?.id }
  )
  const generateBudget = trpc.budget.generate.useMutation({
    onSuccess: () => { refetch(); setGenerating(false) },
    onError: (e) => { toast.error(e.message); setGenerating(false) },
  })

  async function handleGenerate() {
    if (!wedding) return
    const total = parseInt(budgetInput.replace(/\s/g, ''))
    if (isNaN(total) || total < 500_000) {
      toast.error('Budget minimum : 500 000 FCFA')
      return
    }
    setGenerating(true)
    generateBudget.mutate({
      weddingId: wedding.id,
      budgetTotal: total,
      guestCount: wedding.guestCount,
      city: wedding.city,
      style: wedding.style,
      ceremonies: wedding.ceremonies?.map(c => c.type) ?? ['reception'],
    })
  }

  const totalSpent = budget?.categories?.reduce((s, c) => s + c.amountSpent, 0) ?? 0
  const totalPlanned = budget?.totalPlanned ?? 0
  const progressPct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0

  const chartData = budget?.categories?.map(c => ({
    name: c.name,
    value: c.amountRecommended,
  })) ?? []

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
            💰 Sama Budget
          </h1>
          <p className="text-gray-500 text-sm">Budget IA personnalisé pour ton mariage</p>
        </div>
        {budget && (
          <Button variant="outline" size="sm" onClick={() => { setBudgetInput(''); }}>
            Régénérer
          </Button>
        )}
      </div>

      {/* No budget yet — generate */}
      {!budget ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-dashed border-2 border-green-200">
            <CardContent className="py-10 text-center space-y-4">
              {generating ? (
                <div className="space-y-4">
                  <div className="text-4xl animate-bounce">✨</div>
                  <p className="text-lg font-medium" style={{ color: '#1E5631' }}>
                    L&apos;IA prépare ton budget personnalisé...
                  </p>
                  <p className="text-sm text-gray-400">Environ 10 secondes</p>
                </div>
              ) : (
                <>
                  <div className="text-5xl">💰</div>
                  <h2 className="text-xl font-semibold">Génère ton budget IA</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    L&apos;IA va répartir ton budget selon les prix réels du marché sénégalais.
                  </p>
                  <div className="flex gap-3 max-w-sm mx-auto">
                    <Input
                      placeholder="Ex: 5 000 000"
                      value={budgetInput}
                      onChange={e => setBudgetInput(e.target.value)}
                      className="text-center text-lg"
                    />
                    <span className="self-center text-sm text-gray-500 whitespace-nowrap">FCFA</span>
                  </div>
                  <Button onClick={handleGenerate} className="px-8"
                    style={{ background: '#1E5631' }}>
                    Générer mon budget →
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Budget total', value: formatFCFA(totalPlanned), color: '#1E5631' },
              { label: 'Dépensé', value: formatFCFA(totalSpent), color: '#722F37' },
              { label: 'Restant', value: formatFCFA(totalPlanned - totalSpent), color: '#D4A574' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progression des dépenses</span>
                <span className="font-semibold" style={{ color: progressPct > 90 ? '#722F37' : '#1E5631' }}>
                  {progressPct}%
                </span>
              </div>
              <Progress value={progressPct}
                className={progressPct > 90 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-700'} />
            </CardContent>
          </Card>

          {/* Warnings */}
          {budget.warnings && budget.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              {budget.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">⚠️ {w}</p>
              ))}
            </div>
          )}

          {/* Pie Chart + Categories */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      dataKey="value" paddingAngle={2}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => typeof val === 'number' ? formatFCFA(val) : val} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Categories list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Postes budgétaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {budget.categories?.map((cat, i) => {
                  const pct = cat.amountSpent > 0
                    ? Math.round((cat.amountSpent / cat.amountRecommended) * 100)
                    : 0
                  return (
                    <button key={cat.id}
                      onClick={() => router.push(`/app/budget/${cat.id}`)}
                      className="w-full text-left p-3 rounded-lg border hover:border-green-300 hover:bg-green-50 transition-all"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block"
                            style={{ background: COLORS[i % COLORS.length] }} />
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFCFA(cat.amountRecommended)}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1 [&>div]:bg-green-600" />
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
