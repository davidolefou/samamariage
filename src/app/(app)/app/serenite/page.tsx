'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface Message { role: 'assistant' | 'user'; text: string; time: string }

const INITIAL_MSGS: Message[] = [
  { role: 'assistant', text: 'Salam Aïssatou ! Je suis Sama Coach, ton compagnon de mariage bienveillant. Tu peux me parler de ce qui te stresse, me poser des questions sur ton planning, ou juste souffler un peu. Je suis là. 🌿', time: '09:00' },
  { role: 'user',       text: 'J\'ai du mal à dormir à cause du traiteur qui ne répond pas.', time: '09:01' },
  { role: 'assistant', text: 'Je comprends cette frustration, elle est 100% normale à J–216. La solution : envoie-lui un message WhatsApp maintenant avec la date limite de réponse clairement indiquée. J\'ai préparé un modèle de message pour toi — veux-tu que je te l\'envoie ?', time: '09:01' },
]

const QUICK_PROMPTS = [
  'Comment gérer le stress du budget ?',
  'Mon traiteur ne répond plus',
  'Technique de respiration rapide',
  'Organiser les cérémonies du Takk',
]

const WELLNESS_CARDS = [
  { icon: '🌬️', title: 'Respiration 4-7-8', sub: '4 min · Anti-anxiété', color: '#1E5631', desc: 'Inspire 4s, retiens 7s, expire 8s. 4 cycles. Réduit le stress immédiatement.' },
  { icon: '📿', title: 'Affirmations du matin', sub: '3 min · Confiance', color: '#722F37', desc: '"Mon mariage sera beau. Je suis capable. Je mérite cette joie." Répète 7 fois.' },
  { icon: '🎵', title: 'Musique apaisante', sub: 'Playlist Sama', color: '#B98548', desc: 'Kora, xalam, mbalax doux — 30 min de sons du Sénégal pour te recentrer.' },
]

function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const AI_REPLIES = [
  'Je comprends, c\'est une étape normale dans chaque organisation de mariage. Voici ce que je te conseille : 1/ Fixe une deadline de réponse, 2/ Prévois un plan B, 3/ Rappelle-toi que tu as déjà réussi bien plus compliqué.',
  'Ton planning montre une excellente progression. Les phases critiques sont bien gérées. Focus sur cette semaine uniquement — le reste attendra.',
  'Respire. Tu es à {days} jours du plus beau jour de ta vie. Tout ce que tu ressens maintenant, c\'est de l\'amour exprimé sous forme de préparation. 💫',
  'Je t\'ai préparé un modèle de message pour ce prestataire. Veux-tu que je te l\'envoie directement sur WhatsApp ?',
]

export default function SerenityPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [activeWell, setActiveWell] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMsg(text: string) {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]
      setMessages(prev => [...prev, { role: 'assistant', text: reply, time: now() }])
      setTyping(false)
    }, 1600)
  }

  return (
    <div className="grid lg:grid-cols-12 gap-5">

      {/* Left — Chat */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-white shadow-card ring-1 ring-black/5 overflow-hidden" style={{ height: 'calc(100vh - 14rem)', minHeight: 480 }}>

        {/* Chat header */}
        <div className="px-5 py-4 border-b border-black/5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0E2916, #1E5631)' }}>
          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #D4A574, #722F37, #1E5631)' }}>
              <span className="font-display text-xl text-white">S</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1E5631]" style={{ background: '#22c55e' }} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama Coach · IA</div>
            <div className="font-display text-lg text-[#F7E9CF] leading-tight">Ton coach bienveillant</div>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px]" style={{ background: 'rgba(34,197,94,.15)', color: '#86efac' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} /> En ligne
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto nice-scroll px-5 py-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl shrink-0 grid place-items-center font-display text-sm text-white" style={{ background: 'linear-gradient(135deg, #D4A574, #1E5631)' }}>S</div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={{
                  background: msg.role === 'user' ? '#1E5631' : '#FAF7F2',
                  color: msg.role === 'user' ? '#F7E9CF' : '#0E2916',
                }}>
                <p className="text-[13px] leading-relaxed">{msg.text}</p>
                <p className="mt-1 text-[10px] opacity-50" style={{ fontFamily: 'var(--font-jetbrains)', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl shrink-0 grid place-items-center font-display text-sm text-white" style={{ background: 'linear-gradient(135deg, #D4A574, #1E5631)' }}>S</div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: '#FAF7F2' }}>
                <div className="typing text-xl leading-none" style={{ color: '#1E5631' }}><span>·</span><span>·</span><span>·</span></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t border-black/5 flex gap-2 overflow-x-auto nice-scroll">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMsg(p)}
              className="rounded-full border px-3 py-1.5 text-[11px] whitespace-nowrap hover:bg-[#EAF1EC] hover:border-[#1E5631] transition shrink-0"
              style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg(input)}
            placeholder="Parle à Sama Coach…"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[#1E5631]"
            style={{ borderColor: 'rgba(61,61,61,.15)', color: '#0E2916' }}
          />
          <button
            onClick={() => sendMsg(input)}
            disabled={!input.trim()}
            className="grid h-12 w-12 place-items-center rounded-2xl hover:opacity-90 transition disabled:opacity-40"
            style={{ background: '#1E5631', color: '#F7E9CF' }}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </button>
        </div>
      </div>

      {/* Right — Wellness */}
      <div className="lg:col-span-4 space-y-4">
        {/* Quote of the day */}
        <div className="rounded-2xl p-5 text-[#F7E9CF]" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37)' }}>
          <div className="text-[10px] uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Citation du jour</div>
          <blockquote className="font-display text-base leading-snug" style={{ color: '#F7E9CF' }}>
            &ldquo;Ligeey ak xol jamm, bëgg ak xol bu dëkk.&rdquo;
          </blockquote>
          <p className="mt-2 text-[11px]" style={{ color: 'rgba(247,233,207,.6)' }}>Travaille avec un cœur serein, aime avec un cœur entier. — Proverbe wolof</p>
        </div>

        {/* Wellness exercises */}
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <div className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Exercices bien-être</div>
          <div className="space-y-3">
            {WELLNESS_CARDS.map((card, i) => (
              <div key={i}>
                <button
                  onClick={() => setActiveWell(activeWell === i ? null : i)}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-[#FAF7F2]/60 transition text-left"
                  style={{ background: activeWell === i ? 'rgba(61,61,61,.04)' : 'transparent' }}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${card.color}18` }}>
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: '#0E2916' }}>{card.title}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>{card.sub}</div>
                  </div>
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 transition-transform" style={{ color: 'rgba(61,61,61,.35)', transform: activeWell === i ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg>
                </button>
                {activeWell === i && (
                  <div className="mx-3 mb-1 rounded-xl p-3 text-[12px] leading-relaxed" style={{ background: `${card.color}08`, border: `1px solid ${card.color}20`, color: 'rgba(61,61,61,.75)' }}>
                    {card.desc}
                    <button onClick={() => toast.success(`Exercice "${card.title}" commencé !`)} className="mt-2 block text-[11px] font-medium hover:opacity-75 transition" style={{ color: card.color }}>
                      Commencer →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mood tracker */}
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <div className="text-[10px] uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Comment tu te sens aujourd&apos;hui ?</div>
          <div className="flex justify-between">
            {['😰', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
              <button
                key={i}
                onClick={() => toast.success(`Humeur enregistrée — merci Aïssatou 💚`)}
                className="text-2xl hover:scale-125 transition-transform"
              >{emoji}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
