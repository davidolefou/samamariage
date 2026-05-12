'use client'
import { useState } from 'react'
import { formatFCFA, formatEUR, fcfaToEur } from '@/lib/utils'

export function FormatMoney({ amount }: { amount: number }) {
  const [showEur, setShowEur] = useState(false)

  return (
    <button
      onClick={() => setShowEur(e => !e)}
      className="font-mono tabular-nums hover:opacity-70 transition-opacity"
      title="Cliquer pour changer de devise"
    >
      {showEur ? formatEUR(fcfaToEur(amount)) : formatFCFA(amount)}
    </button>
  )
}
