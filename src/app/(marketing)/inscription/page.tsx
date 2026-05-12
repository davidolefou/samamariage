'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const phoneSchema = z.object({
  phone: z.string().regex(/^\+221[0-9]{9}$/, 'Format: +221 XX XXX XX XX'),
})

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
})

type PhoneForm = z.infer<typeof phoneSchema>
type EmailForm = z.infer<typeof emailSchema>

export default function InscriptionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) })
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  async function onPhoneSubmit({ phone }: PhoneForm) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/verification?phone=${encodeURIComponent(phone)}`)
  }

  async function onEmailSubmit({ email }: EmailForm) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/verification?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1E5631 0%, #2d7a47 60%, #D4A574 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="text-3xl mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
            SamaMariage
          </div>
          <CardTitle className="text-xl">Créer mon compte</CardTitle>
          <CardDescription>Commence à organiser ton mariage en 2 minutes</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border p-1 mb-6 bg-gray-50">
            <button
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'phone' ? 'bg-white shadow text-green-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              📱 Téléphone
            </button>
            <button
              onClick={() => setMode('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'email' ? 'bg-white shadow text-green-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              ✉️ Email
            </button>
          </div>

          {mode === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+221 77 123 45 67"
                  {...phoneForm.register('phone')}
                  className="text-lg"
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
              <Button type="submit" className="w-full text-base py-5" disabled={loading}
                style={{ background: '#1E5631' }}>
                {loading ? 'Envoi du code...' : 'Recevoir le code SMS →'}
              </Button>
            </form>
          ) : (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="toi@exemple.com"
                  {...emailForm.register('email')}
                  className="text-lg"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
              <Button type="submit" className="w-full text-base py-5" disabled={loading}
                style={{ background: '#1E5631' }}>
                {loading ? 'Envoi du lien...' : 'Recevoir le lien magique →'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="font-medium" style={{ color: '#1E5631' }}>
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
