'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function VerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const phone = searchParams.get('phone') ?? ''
  const email = searchParams.get('email') ?? ''
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
    const timer = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  function handleInput(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) verifyCode(next.join(''))
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function verifyCode(token: string) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp(
      phone
        ? { phone, token, type: 'sms' }
        : { email, token, type: 'email' }
    )
    if (error) {
      setError('Code incorrect. Vérifie et réessaie.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
      setLoading(false)
      return
    }
    router.push('/onboarding')
  }

  async function resend() {
    if (resendCooldown > 0) return
    const supabase = createClient()
    if (phone) await supabase.auth.signInWithOtp({ phone })
    else await supabase.auth.signInWithOtp({ email })
    setResendCooldown(60)
  }

  const contact = phone || email

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1E5631 0%, #2d7a47 60%, #D4A574 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-3">📩</div>
          <CardTitle className="text-xl">Code de vérification</CardTitle>
          <CardDescription className="text-base">
            Code envoyé à <strong>{contact}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex gap-3 justify-center mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                  ${digit ? 'border-green-600 bg-green-50' : 'border-gray-200'}
                  focus:border-green-600 focus:ring-2 focus:ring-green-100`}
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg text-center mb-4">{error}</p>}

          <Button
            onClick={() => verifyCode(code.join(''))}
            disabled={code.join('').length !== 6 || loading}
            className="w-full text-base py-5 mb-4"
            style={{ background: '#1E5631' }}>
            {loading ? 'Vérification...' : 'Confirmer le code'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Pas reçu ?{' '}
            <button
              onClick={resend}
              disabled={resendCooldown > 0}
              className={`font-medium ${resendCooldown > 0 ? 'text-gray-400' : 'text-green-700 hover:underline'}`}>
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerificationPage() {
  return (
    <Suspense>
      <VerificationForm />
    </Suspense>
  )
}
