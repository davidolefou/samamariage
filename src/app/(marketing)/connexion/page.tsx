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

const schema = z.object({
  contact: z.string().min(5, 'Téléphone ou email requis'),
})

export default function ConnexionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ contact }: { contact: string }) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const isPhone = contact.startsWith('+')
    const { error } = isPhone
      ? await supabase.auth.signInWithOtp({ phone: contact })
      : await supabase.auth.signInWithOtp({ email: contact })

    if (error) { setError(error.message); setLoading(false); return }

    const param = isPhone
      ? `phone=${encodeURIComponent(contact)}`
      : `email=${encodeURIComponent(contact)}`
    router.push(`/verification?${param}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1E5631 0%, #2d7a47 60%, #D4A574 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="text-3xl mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1E5631' }}>
            SamaMariage
          </div>
          <CardTitle className="text-xl">Bon retour 👋</CardTitle>
          <CardDescription>Entre ton téléphone ou email pour te connecter</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Téléphone ou Email</Label>
              <Input
                id="contact"
                placeholder="+221 77 123 45 67 ou toi@exemple.com"
                {...register('contact')}
                className="text-lg"
              />
              {errors.contact && (
                <p className="text-sm text-red-500">{errors.contact.message as string}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Button type="submit" className="w-full text-base py-5" disabled={loading}
              style={{ background: '#1E5631' }}>
              {loading ? 'Envoi du code...' : 'Recevoir le code →'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="font-medium" style={{ color: '#1E5631' }}>
              S&apos;inscrire
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
