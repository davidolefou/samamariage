'use client'
import { useState } from 'react'
import { toast } from 'sonner'

const PALETTE = [
  { name: 'Vert royal', hex: '#1E5631' },
  { name: 'Or doux',    hex: '#D4A574' },
  { name: 'Bordeaux',   hex: '#722F37' },
  { name: 'Ivoire',     hex: '#FAF7F2' },
  { name: 'Sable',      hex: '#F4E4C1' },
  { name: 'Noir nuit',  hex: '#0E2916' },
]

const INSPIRATIONS = [
  { id: 1, label: 'Architecture coloniale',  cat: 'Lieu',    ph: 'ph-1',    added: true  },
  { id: 2, label: 'Décor floral tropical',   cat: 'Décor',   ph: 'ph-2',    added: true  },
  { id: 3, label: 'Or & bazin',              cat: 'Tenue',   ph: 'ph-3',    added: true  },
  { id: 4, label: 'Henné arabesque',         cat: 'Beauté',  ph: 'ph-4',    added: true  },
  { id: 5, label: 'Lumières chaudes',        cat: 'Ambiance', ph: 'ph-5',   added: true  },
  { id: 6, label: 'Réception dansante',      cat: 'Ambiance', ph: 'ph-6',   added: true  },
  { id: 7, label: 'Table setting royal',     cat: 'Décor',   ph: 'ph-1',    added: false },
  { id: 8, label: 'Bouquet de roses',        cat: 'Fleurs',  ph: 'ph-3',    added: false },
  { id: 9, label: 'Couloir fleuri',          cat: 'Décor',   ph: 'ph-5',    added: false },
]

const CATS = ['Tous', 'Lieu', 'Décor', 'Tenue', 'Beauté', 'Ambiance', 'Fleurs']

export default function MoodPage() {
  const [items, setItems] = useState(INSPIRATIONS)
  const [activecat, setActivecat] = useState('Tous')

  const added   = items.filter(i => i.added)
  const filtered = (activecat === 'Tous' ? items : items.filter(i => i.cat === activecat))

  function toggleAdd(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, added: !i.added } : i))
    const item = items.find(i => i.id === id)
    if (item) {
      toast.success(item.added ? 'Retiré du board' : 'Ajouté à ton mood board !', { description: item.label })
    }
  }

  return (
    <>
      {/* Header banner */}
      <div className="rounded-2xl p-6 mb-6 text-[#F7E9CF]" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Style</div>
            <h2 className="font-display text-3xl mb-2">Royal sénégalais moderne</h2>
            <p className="text-sm" style={{ color: 'rgba(247,233,207,.75)' }}>{added.length} inspirations sélectionnées · palette couleur définie</p>
          </div>
          <button
            onClick={() => toast.info('Partage avec ton groupe WhatsApp ou ta wedding planner !')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition shrink-0"
            style={{ background: '#D4A574', color: '#3D181C' }}
          >
            Partager
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 5l5 5-5 5M3 10h15M9 5l-5 5 5 5"/></svg>
          </button>
        </div>

        {/* Palette */}
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.7)' }}>Palette de couleurs</div>
          <div className="flex items-center gap-2 flex-wrap">
            {PALETTE.map(p => (
              <div key={p.hex} className="flex items-center gap-2 rounded-full px-3 py-1.5 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.15)' }}>
                <span className="h-4 w-4 rounded-full ring-1 ring-white/30 shrink-0" style={{ background: p.hex }} />
                <span className="text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(247,233,207,.8)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setActivecat(cat)}
            className="rounded-full px-3.5 py-2 text-[12px] font-medium transition"
            style={{
              background: activecat === cat ? '#1E5631' : 'white',
              color:      activecat === cat ? '#F7E9CF' : 'rgba(61,61,61,.7)',
              outline:    activecat === cat ? 'none' : '1px solid rgba(61,61,61,.12)',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {filtered.map((item, idx) => (
          <div key={item.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => toggleAdd(item.id)}>
            <div
              className={`ph ${item.ph} ${idx % 3 === 1 ? 'aspect-[3/4]' : 'aspect-square'}`}
              data-label={item.label}
            />
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'linear-gradient(to top, rgba(14,41,22,.8) 0%, rgba(14,41,22,.3) 50%, transparent 100%)' }}>
              <div className="self-end">
                <div className={`grid h-8 w-8 place-items-center rounded-full ${item.added ? 'bg-[#D4A574]' : 'bg-white/90'}`}>
                  {item.added
                    ? <svg viewBox="0 0 16 16" className="h-4 w-4" style={{ color: '#3D181C' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 8 3 3 7-7"/></svg>
                    : <svg viewBox="0 0 16 16" className="h-4 w-4" style={{ color: '#1E5631' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12"/></svg>
                  }
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.8)' }}>{item.cat}</div>
                <div className="text-sm font-medium text-[#F7E9CF]">{item.label}</div>
              </div>
            </div>

            {/* Badge if added */}
            {item.added && (
              <div className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full" style={{ background: '#D4A574' }}>
                <svg viewBox="0 0 12 12" className="h-3 w-3" style={{ color: '#3D181C' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 6 2.5 2.5 5.5-5"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add more CTA */}
      <div className="mt-6 rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: 'rgba(212,165,116,.3)', background: 'rgba(244,228,193,.1)' }}>
        <div className="text-3xl mb-3">✨</div>
        <div className="font-display text-xl mb-2" style={{ color: '#0E2916' }}>Ajoute tes propres inspirations</div>
        <p className="text-sm mb-4" style={{ color: 'rgba(61,61,61,.6)' }}>Importe depuis Pinterest, Instagram, ou via ton téléphone.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: '📌', label: 'Pinterest' },
            { icon: '📱', label: 'Depuis mon téléphone' },
            { icon: '🔗', label: 'Coller un lien' },
          ].map(src => (
            <button key={src.label} onClick={() => toast.info(`Import ${src.label} bientôt disponible !`)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border hover:bg-[#FAF7F2] transition"
              style={{ borderColor: 'rgba(61,61,61,.15)', color: '#3D3D3D' }}>
              {src.icon} {src.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
