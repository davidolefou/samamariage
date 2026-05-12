'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const TOTAL_STEPS = 5

const STYLES = [
  { id: 'traditionnel', label: 'Traditionnel', emoji: '🎋', desc: 'Grand boubou, cérémonie classique' },
  { id: 'moderne', label: 'Moderne', emoji: '✨', desc: 'Élégant et contemporain' },
  { id: 'fusion', label: 'Fusion', emoji: '🌿', desc: 'Mix tradition et modernité' },
  { id: 'royal', label: 'Royal', emoji: '👑', desc: 'Luxueux et grandiose' },
  { id: 'boheme', label: 'Bohème', emoji: '🌸', desc: 'Naturel et romantique' },
] as const

const CEREMONIES = [
  { id: 'takk', label: 'Takk', emoji: '🤝', desc: 'Cérémonie de demande' },
  { id: 'ceet', label: 'Céet', emoji: '🥁', desc: 'Nuit de fête' },
  { id: 'civil', label: 'Civil', emoji: '📜', desc: 'Mariage civil' },
  { id: 'reception', label: 'Réception', emoji: '🎉', desc: 'Grande fête' },
] as const

type CeremonyType = 'takk' | 'ceet' | 'civil' | 'reception'
type StyleType = 'traditionnel' | 'moderne' | 'fusion' | 'royal' | 'boheme'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState({
    fullName: '',
    weddingDate: '',
    weddingDateApprox: '',
    dateType: 'fixed' as 'fixed' | 'approx' | 'unknown',
    guestCount: 200,
    ceremonies: ['reception'] as CeremonyType[],
    style: 'fusion' as StyleType,
    city: 'Dakar',
  })

  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => router.push('/app'),
    onError: (e) => console.error(e),
  })

  function next() {
    setDirection(1)
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function back() {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 1))
  }

  function toggleCeremony(id: CeremonyType) {
    setData(d => ({
      ...d,
      ceremonies: d.ceremonies.includes(id)
        ? d.ceremonies.filter(c => c !== id)
        : [...d.ceremonies, id],
    }))
  }

  async function finish() {
    await completeOnboarding.mutateAsync({
      fullName: data.fullName,
      weddingDate: data.dateType === 'fixed' ? data.weddingDate : null,
      weddingDateApprox: data.dateType === 'approx' ? data.weddingDateApprox : null,
      guestCount: data.guestCount,
      ceremonies: data.ceremonies,
      style: data.style,
      city: data.city,
    })
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f6f2' }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Étape {step} sur {TOTAL_STEPS}</span>
            <span className="text-sm font-medium" style={{ color: '#1E5631' }}>
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
        <div className="w-full max-w-lg">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
                      Comment t&apos;appelles-tu ? 💍
                    </h1>
                    <p className="text-gray-500">On va personnaliser tout pour toi</p>
                  </div>
                  <Input
                    value={data.fullName}
                    onChange={e => setData(d => ({ ...d, fullName: e.target.value }))}
                    placeholder="Ton prénom et nom"
                    className="text-xl py-6 text-center"
                    autoFocus
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
                      Quand te maries-tu ? 📅
                    </h1>
                    <p className="text-gray-500">Même approximatif, c&apos;est utile</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: 'fixed', label: '📆 Date fixée', desc: 'J\'ai une date précise' },
                      { id: 'approx', label: '🗓️ Mois approximatif', desc: 'Je sais à peu près quand' },
                      { id: 'unknown', label: '🤷 Pas encore décidé', desc: 'On verra plus tard' },
                    ].map(opt => (
                      <button key={opt.id}
                        onClick={() => setData(d => ({ ...d, dateType: opt.id as typeof d.dateType }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          data.dateType === opt.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-sm text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {data.dateType === 'fixed' && (
                    <Input type="date" value={data.weddingDate}
                      onChange={e => setData(d => ({ ...d, weddingDate: e.target.value }))}
                      className="text-lg" />
                  )}
                  {data.dateType === 'approx' && (
                    <Input type="month" value={data.weddingDateApprox}
                      onChange={e => setData(d => ({ ...d, weddingDateApprox: e.target.value }))}
                      className="text-lg" />
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
                      Combien d&apos;invités ? 👥
                    </h1>
                    <p className="text-gray-500">Ca aide à calibrer le budget</p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4" style={{ color: '#1E5631' }}>
                      {data.guestCount}
                    </div>
                    <input
                      type="range"
                      min={50} max={2000} step={50}
                      value={data.guestCount}
                      onChange={e => setData(d => ({ ...d, guestCount: Number(e.target.value) }))}
                      className="w-full accent-green-700"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>50</span><span>500</span><span>1 000</span><span>2 000</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Ville</label>
                    <Input
                      value={data.city}
                      onChange={e => setData(d => ({ ...d, city: e.target.value }))}
                      placeholder="Dakar, Thiès, Saint-Louis..."
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
                      Quelles cérémonies ? 🎊
                    </h1>
                    <p className="text-gray-500">Tu peux en choisir plusieurs</p>
                  </div>
                  <div className="grid gap-3">
                    {CEREMONIES.map(c => (
                      <button key={c.id}
                        onClick={() => toggleCeremony(c.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          data.ceremonies.includes(c.id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.emoji}</span>
                          <div>
                            <div className="font-semibold">{c.label}</div>
                            <div className="text-sm text-gray-500">{c.desc}</div>
                          </div>
                          {data.ceremonies.includes(c.id) && (
                            <span className="ml-auto text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
                      Quel style ? ✨
                    </h1>
                    <p className="text-gray-500">Ça guidera l&apos;IA pour tes suggestions</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {STYLES.map(s => (
                      <button key={s.id}
                        onClick={() => setData(d => ({ ...d, style: s.id }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          data.style === s.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="text-3xl mb-2">{s.emoji}</div>
                        <div className="font-semibold text-sm">{s.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={back} className="flex-1 py-5">
              ← Retour
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              onClick={next}
              disabled={step === 1 && !data.fullName.trim()}
              className="flex-1 py-5 text-base"
              style={{ background: '#1E5631' }}>
              Suivant →
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={data.ceremonies.length === 0 || completeOnboarding.isPending}
              className="flex-1 py-5 text-base"
              style={{ background: '#1E5631' }}>
              {completeOnboarding.isPending ? '✨ Création de ton espace...' : 'Commencer mon organisation 🎉'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
