'use client';

// SamaMariage — Sama Coach : panneau de conversation flottant (widget global).
// Porté pixel-perfect du design `sama-coach.js`. Lanceur pétale + panneau bulle
// (plein écran sur mobile), écran d'accueil avec suggestions, fil de messages
// avec cartes d'action et chips, composer (dictée vocale + envoi), historique
// local (localStorage). IA réelle via POST /api/coach (AI Gateway, task 'chat').

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────
type TaskCard = { type: 'tasks'; title?: string; items?: string[] };
type BudgetLine = { label: string; amount: number | string; flag?: 'over' | 'ok' | null };
type BudgetCard = { type: 'budget'; title?: string; spent?: number; total?: number; lines?: BudgetLine[] };
type VendorCard = { type: 'vendor'; name: string; cat?: string; price?: string; rating?: number; note?: string };
type CountdownCard = { type: 'countdown'; days: number; date?: string; label?: string };
type NoteCard = { type: 'note'; title?: string; body?: string };
type Card = TaskCard | BudgetCard | VendorCard | CountdownCard | NoteCard;

interface Msg {
  role: 'user' | 'coach';
  text: string;
  cards?: Card[];
  chips?: string[];
}

interface CoachResponse {
  ok: boolean;
  reply: string;
  chips?: string[];
  cards?: Card[];
}

interface StoredThread {
  id: string;
  title: string;
  ts: number;
  messages: Msg[];
}

// Types minimaux pour la Web Speech API (souvent absente de lib.dom).
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface MinimalRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechResultEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => MinimalRecognition;

const HKEY = 'sama:coach:threads:v1';
const MAX_TURNS = 16;

const SUGGEST: { icon: string; tag: string; q: string[] }[] = [
  { icon: '📋', tag: 'Planning', q: ['Que dois-je régler en priorité ?', 'Fais-moi un rétroplanning des 3 prochains mois'] },
  { icon: '🤝', tag: 'Prestataires', q: ['Recommande-moi un photographe', 'Compare mes options de traiteur'] },
  { icon: '💰', tag: 'Budget', q: ['Où puis-je économiser sans que ça se voie ?', 'Aide-moi à ventiler mon budget'] },
  { icon: '🕊️', tag: 'Traditions', q: ['Explique-moi le déroulé du takk', 'Comment gérer le ndawtal avec la belle-famille ?'] },
  { icon: '🌸', tag: 'Sérénité', q: ['Je suis stressée, aide-moi à relativiser', 'Un rituel anti-stress pour ce soir ?'] },
  { icon: '✍️', tag: 'Rédaction', q: ['Rédige le texte de mes faire-part', "Aide-moi à écrire un mot pour mes parents"] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fcfa(n: number): string {
  return Math.round(n).toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ') + ' F';
}

// Rendu inline minimal du gras **texte**.
function MdInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

function timeAgo(ts: number, now: number): string {
  const d = (now - ts) / 1000;
  if (d < 60) return "à l'instant";
  if (d < 3600) return Math.floor(d / 60) + ' min';
  if (d < 86400) return Math.floor(d / 3600) + ' h';
  return Math.floor(d / 86400) + ' j';
}

function loadThreads(): StoredThread[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) || '[]') as StoredThread[];
  } catch {
    return [];
  }
}
function saveThreads(t: StoredThread[]): void {
  try {
    localStorage.setItem(HKEY, JSON.stringify(t.slice(0, 30)));
  } catch {
    // best-effort
  }
}

// ── Cartes d'action ──────────────────────────────────────────────────────────
function CardView({ card, onToast }: { card: Card; onToast: (m: string) => void }) {
  if (card.type === 'tasks') {
    return (
      <div className="sc-card">
        <div className="sc-ct">Check-list</div>
        <h5>{card.title || 'À faire'}</h5>
        <div style={{ marginTop: 6 }}>
          {(card.items ?? []).map((it, i) => (
            <TaskRow key={i} label={it} />
          ))}
        </div>
      </div>
    );
  }
  if (card.type === 'budget') {
    const pct = card.total ? Math.min(100, Math.round(((card.spent ?? 0) / card.total) * 100)) : 0;
    return (
      <div className="sc-card">
        <div className="sc-ct">Budget</div>
        <h5>{card.title || 'Aperçu budget'}</h5>
        {card.total ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, color: 'rgba(61,61,61,.6)' }}>
              <span>Dépensé {fcfa(card.spent ?? 0)}</span>
              <span>/ {fcfa(card.total)}</span>
            </div>
            <div className="sc-bar">
              <i style={{ width: pct + '%' }} />
            </div>
          </>
        ) : null}
        {(card.lines ?? []).length > 0 && (
          <div style={{ marginTop: 9 }}>
            {(card.lines ?? []).map((l, i) => (
              <div className="sc-line" key={i}>
                <span style={{ color: 'rgba(61,61,61,.7)' }}>{l.label}</span>
                <span className={l.flag === 'over' ? 'sc-flag-over' : l.flag === 'ok' ? 'sc-flag-ok' : ''}>
                  {typeof l.amount === 'number' ? fcfa(l.amount) : l.amount}
                  {l.flag === 'over' ? ' ⚠' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (card.type === 'vendor') {
    return (
      <div className="sc-card">
        <div className="sc-vd">
          <div className="av" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="sc-disp" style={{ fontSize: 16, color: '#0E2916' }}>
                {card.name}
              </span>
              {card.rating != null && (
                <span className="sc-mono" style={{ fontSize: 11, color: '#173F24' }}>
                  ★ {card.rating}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(61,61,61,.55)' }}>
              {card.cat || ''}
              {card.price ? ' · ' + card.price : ''}
            </div>
          </div>
        </div>
        {card.note && <p style={{ fontSize: 12.5, color: 'rgba(61,61,61,.7)', lineHeight: 1.45, marginTop: 8 }}>{card.note}</p>}
        <button className="sc-cta" type="button" onClick={() => onToast('Demande de devis envoyée à ' + card.name + ' 📨')}>
          Demander un devis →
        </button>
      </div>
    );
  }
  if (card.type === 'countdown') {
    return (
      <div className="sc-card" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div className="sc-disp" style={{ fontSize: 30, color: 'var(--sc-accent)', lineHeight: 1 }}>
            J-{card.days}
          </div>
        </div>
        <div>
          {card.date && (
            <div className="sc-disp" style={{ fontSize: 15, color: '#0E2916' }}>
              {card.date}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'rgba(61,61,61,.6)' }}>{card.label || "jusqu'au jour J"}</div>
        </div>
      </div>
    );
  }
  if (card.type === 'note') {
    const body = card.body || '';
    return (
      <div className="sc-card">
        <div className="sc-ct">✍️ Rédigé pour toi</div>
        {card.title && <h5>{card.title}</h5>}
        <div className="sc-note">
          <MdInline text={body} />
        </div>
        <button
          className="sc-cta"
          type="button"
          onClick={() => {
            if (navigator.clipboard) navigator.clipboard.writeText(body).then(() => onToast('Texte copié ✓'), () => onToast('Copie indisponible'));
            else onToast('Copie indisponible');
          }}
        >
          Copier le texte
        </button>
      </div>
    );
  }
  return null;
}

function TaskRow({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className={'sc-task' + (done ? ' done' : '')} onClick={() => setDone((d) => !d)}>
      <span className="sc-cb">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#FBF4EA" strokeWidth="2.6">
          <path d="m3 8 3 3 7-7" />
        </svg>
      </span>
      <span>{label}</span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function SamaCoach({ firstName }: { firstName?: string }) {
  const greetingName = firstName?.trim() || '';
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [stored, setStored] = useState<StoredThread[]>([]);
  const [now, setNow] = useState(0);
  const [recording, setRecording] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentId = useRef<string | null>(null);
  const recRef = useRef<MinimalRecognition | null>(null);
  const recBase = useRef('');

  const scrollEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const b = bodyRef.current;
      if (b) b.scrollTop = b.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (open) scrollEnd();
  }, [open, thread, busy, scrollEnd]);

  // Persistance du fil courant.
  const persist = useCallback((msgs: Msg[]) => {
    if (!msgs.length) return;
    const all = loadThreads();
    const title = (msgs.find((m) => m.role === 'user')?.text || 'Conversation').slice(0, 60);
    if (!currentId.current) currentId.current = 'c' + Date.now();
    const rec: StoredThread = { id: currentId.current, title, ts: Date.now(), messages: msgs };
    const i = all.findIndex((x) => x.id === rec.id);
    if (i >= 0) all[i] = rec;
    else all.unshift(rec);
    saveThreads(all);
  }, []);

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (busy || !text) return;
      setBusy(true);
      const userMsg: Msg = { role: 'user', text };
      const next = [...thread, userMsg];
      setThread(next);
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }

      const payload = next
        .slice(-MAX_TURNS)
        .map((m) => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

      let coachMsg: Msg;
      try {
        const res = await api<CoachResponse>('/api/coach', { method: 'POST', body: { messages: payload } });
        coachMsg = { role: 'coach', text: res.reply, cards: res.cards ?? [], chips: res.chips ?? [] };
      } catch (err) {
        const code = err instanceof ApiError ? err.code : '';
        const text503 = "Sama Coach n'est pas encore activée sur ton espace. Reviens bientôt 🌸";
        const text429 = 'On a beaucoup discuté aujourd\'hui — je reviens en pleine forme demain 💛';
        coachMsg = {
          role: 'coach',
          text:
            code === 'AI_NOT_CONFIGURED'
              ? text503
              : code === 'AI_RATE_LIMITED'
                ? text429
                : "Je n'arrive pas à me connecter là, tout de suite. Réessaie dans un instant — je reste avec toi 💛",
          cards: [],
          chips: [],
        };
      }
      const finalThread = [...next, coachMsg];
      setThread(finalThread);
      persist(finalThread);
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [busy, thread, persist],
  );

  // Ouverture via évènement global (boutons "Chatter" sur les pages).
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('sama-coach:open', openHandler);
    return () => window.removeEventListener('sama-coach:open', openHandler);
  }, []);

  // Échap pour fermer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Dictée vocale (Web Speech API), si dispo.
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setRecording(true);
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.onresult = (e: SpeechResultEvent) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i]?.[0]?.transcript ?? '';
      if (inputRef.current) {
        inputRef.current.value = recBase.current + t;
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(120, inputRef.current.scrollHeight) + 'px';
      }
    };
    recRef.current = rec;
    setMicSupported(true);
    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, []);

  function toggleMic() {
    const rec = recRef.current;
    if (!rec) return;
    if (recording) {
      rec.stop();
      return;
    }
    recBase.current = inputRef.current?.value ? inputRef.current.value + ' ' : '';
    try {
      rec.start();
    } catch {
      /* déjà démarré */
    }
  }

  function newConversation() {
    if (thread.length) persist(thread);
    currentId.current = null;
    setThread([]);
  }

  function openHistory() {
    setStored(loadThreads());
    setNow(Date.now());
    setHistoryOpen(true);
  }

  function restoreThread(t: StoredThread) {
    setThread(t.messages);
    currentId.current = t.id;
    setHistoryOpen(false);
  }

  // Toast minimal interne.
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = useCallback((m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 2200);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputRef.current) void submit(inputRef.current.value);
    }
  }
  function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(120, el.scrollHeight) + 'px';
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Lanceur */}
      <button className={'sc-launcher' + (open ? ' sc-hidden' : '')} aria-label="Ouvrir Sama Coach" onClick={() => setOpen(true)}>
        <span className="sc-orb">
          <span className="sc-ring" />
          <svg viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="#FBF4EA" strokeWidth="1.7">
            <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
            <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
            <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
          </svg>
        </span>
        <span className="sc-lab">Sama Coach</span>
      </button>

      {/* Scrim */}
      <div className={'sc-scrim' + (open ? ' sc-on' : '')} onClick={() => setOpen(false)} />

      {/* Panneau */}
      <section className={'sc-panel' + (open ? ' sc-on' : '')} role="dialog" aria-label="Sama Coach">
        <div className="sc-head">
          <div className="sc-wax" />
          <div className="sc-blob" />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="sc-avatar">
              <span className="sc-disp" style={{ fontSize: 22, color: '#FBF4EA' }}>
                S
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sc-mono" style={{ fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: '#D4A574' }}>
                Sama Coach · IA
              </div>
              <div className="sc-disp" style={{ fontSize: 19, lineHeight: 1.1, marginTop: 1 }}>
                Sama Coach
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11, color: 'rgba(251,244,234,.7)' }}>
                <span style={{ height: 7, width: 7, borderRadius: 99, background: '#7DD08F', boxShadow: '0 0 0 3px rgba(125,208,143,.25)' }} />
                En ligne · répond en quelques secondes
              </div>
            </div>
            <button className="sc-ico-btn" title="Historique" aria-label="Historique" onClick={openHistory}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3v6h6M3 9a9 9 0 1 0 2.5-5.5L3 9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </button>
            <button className="sc-ico-btn" title="Nouvelle conversation" aria-label="Nouvelle conversation" onClick={newConversation}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button className="sc-ico-btn" title="Fermer" aria-label="Fermer" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sc-body" ref={bodyRef}>
          {thread.length === 0 ? (
            <div className="sc-welcome">
              <div className="sc-row">
                <div className="sc-mini sc-disp">S</div>
                <div className="sc-bub coach">
                  <strong>Bonjour {greetingName || 'à toi'} 🌸</strong>
                  <br />
                  Je suis là pour ton mariage — organisation, prestataires, budget, traditions, ou juste souffler un peu. Par quoi on commence&nbsp;?
                </div>
              </div>
              <div className="sc-sug">
                {SUGGEST.map((g) => (
                  <div className="sc-sgroup" key={g.tag}>
                    <div className="sc-sh">
                      <span>{g.icon}</span>
                      {g.tag}
                    </div>
                    {g.q.map((q) => (
                      <button className="sc-sq" key={q} type="button" onClick={() => void submit(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            thread.map((m, idx) => (
              <div key={idx}>
                <div className={'sc-row' + (m.role === 'user' ? ' user' : '')}>
                  {m.role === 'coach' && <div className="sc-mini sc-disp">S</div>}
                  <div className={'sc-bub ' + (m.role === 'user' ? 'user' : 'coach')}>
                    <MdInline text={m.text} />
                  </div>
                </div>
                {m.role === 'coach' && (m.cards?.length ?? 0) > 0 && (
                  <div className="sc-cards">
                    {m.cards!.map((c, i) => (
                      <CardView key={i} card={c} onToast={toast} />
                    ))}
                  </div>
                )}
                {m.role === 'coach' && (m.chips?.length ?? 0) > 0 && (
                  <div className="sc-chips">
                    {m.chips!.map((q) => (
                      <button className="sc-chip" key={q} type="button" onClick={() => void submit(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {busy && (
            <div className="sc-row">
              <div className="sc-mini sc-disp">S</div>
              <div className="sc-bub coach">
                <span className="sc-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="sc-comp">
          <div className="sc-inwrap">
            <textarea
              ref={inputRef}
              className="sc-ta"
              rows={1}
              placeholder="Écris à Sama Coach…"
              onKeyDown={onKeyDown}
              onInput={autoGrow}
            />
            {micSupported && (
              <button className={'sc-tool' + (recording ? ' rec' : '')} type="button" title="Dicter" aria-label="Dicter" onClick={toggleMic}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </button>
            )}
            <button
              className="sc-send"
              type="button"
              aria-label="Envoyer"
              disabled={busy}
              onClick={() => {
                if (inputRef.current) void submit(inputRef.current.value);
              }}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 12l16-8-6 16-3-7-7-1z" />
              </svg>
            </button>
          </div>
          <div className="sc-foot">Sama Coach peut se tromper · vérifie les montants importants</div>
        </div>

        {/* Historique */}
        <div className={'sc-hist' + (historyOpen ? ' sc-on' : '')}>
          <div className="sc-head" style={{ padding: 16 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="sc-ico-btn" aria-label="Retour" onClick={() => setHistoryOpen(false)}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <div className="sc-disp" style={{ fontSize: 18 }}>
                Mes conversations
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {stored.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(61,61,61,.45)', fontSize: 13, padding: '40px 0' }}>
                Aucune conversation pour l'instant.
                <br />
                Pose ta première question à Sama Coach 🌸
              </div>
            ) : (
              stored.map((t) => (
                <button className="sc-hitem" key={t.id} type="button" onClick={() => restoreThread(t)}>
                  <div className="sc-disp" style={{ fontSize: 14.5, color: '#0E2916', lineHeight: 1.25 }}>
                    {t.title}
                  </div>
                  <div className="sc-mono" style={{ fontSize: 10, color: 'rgba(61,61,61,.45)', marginTop: 4 }}>
                    {t.messages.length} messages · il y a {timeAgo(t.ts, now)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {toastMsg && <div className="sc-flash">{toastMsg}</div>}
    </>
  );
}

// CSS porté de sama-coach.js (accent bordeaux figé, polices = variables next/font).
const CSS = `
.sc-mono{font-family:var(--font-jetbrains),'JetBrains Mono',ui-monospace,monospace;}
.sc-disp{font-family:var(--font-playfair),'Playfair Display',Georgia,serif;letter-spacing:-.01em;}
:root{--sc-accent:#722F37;}
.sc-launcher{position:fixed;right:22px;bottom:22px;z-index:70;display:inline-flex;align-items:center;gap:10px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#0E2916,#722F37 65%,var(--sc-accent));color:#FBF4EA;border-radius:99px;padding:13px 16px;
  box-shadow:0 24px 50px -18px rgba(14,41,22,.6),0 2px 0 rgba(255,255,255,.08) inset;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s,opacity .2s;}
.sc-launcher:hover{transform:translateY(-2px);box-shadow:0 30px 60px -18px rgba(14,41,22,.7);}
.sc-launcher.sc-hidden{opacity:0;pointer-events:none;transform:translateY(12px);}
.sc-launcher .sc-orb{position:relative;display:grid;place-items:center;height:34px;width:34px;border-radius:99px;background:rgba(251,244,234,.12);}
.sc-launcher .sc-ring{position:absolute;inset:-5px;border-radius:99px;border:1.5px solid var(--sc-accent);opacity:.5;animation:sc-ping 2.6s ease-out infinite;}
@keyframes sc-ping{0%{transform:scale(.8);opacity:.55}100%{transform:scale(1.5);opacity:0}}
.sc-launcher .sc-lab{font-size:13px;font-weight:600;padding-right:4px;}
.sc-scrim{position:fixed;inset:0;z-index:75;background:rgba(14,41,22,.42);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .3s;}
.sc-scrim.sc-on{opacity:1;pointer-events:auto;}
.sc-panel{position:fixed;z-index:80;background:#FAF7F2;display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 40px 100px -30px rgba(14,41,22,.55);opacity:0;pointer-events:none;
  right:22px;bottom:22px;width:418px;height:min(722px,86vh);border-radius:26px;transform:translateY(28px) scale(.98);
  border:1px solid rgba(61,61,61,.07);transition:transform .38s cubic-bezier(.2,.8,.2,1),opacity .3s;}
.sc-panel.sc-on{opacity:1;pointer-events:auto;transform:none;}
@media (max-width:640px){
  .sc-panel{inset:0;width:100%;height:100%;border-radius:0;transform:translateY(100%);}
  .sc-panel.sc-on{transform:none;}
}
.sc-head{position:relative;background:linear-gradient(135deg,#0E2916 0%,#173F24 45%,#722F37 100%);color:#FBF4EA;padding:18px 16px 16px;overflow:hidden;flex-shrink:0;}
.sc-head .sc-wax{position:absolute;inset:0;opacity:.22;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.5) 1px,transparent 1.4px);background-size:16px 16px;}
.sc-head .sc-blob{position:absolute;right:-40px;top:-50px;height:150px;width:150px;border-radius:99px;background:var(--sc-accent);opacity:.28;filter:blur(34px);}
.sc-avatar{height:46px;width:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#D4A574,#722F37 55%,#1E5631);box-shadow:0 6px 18px -8px rgba(0,0,0,.5);}
.sc-ico-btn{display:grid;place-items:center;height:34px;width:34px;border-radius:11px;background:rgba(251,244,234,.12);color:#FBF4EA;border:none;cursor:pointer;transition:background .2s;}
.sc-ico-btn:hover{background:rgba(251,244,234,.24);}
.sc-body{flex:1;overflow-y:auto;padding:18px 16px 8px;scroll-behavior:smooth;}
.sc-body::-webkit-scrollbar{width:7px;} .sc-body::-webkit-scrollbar-thumb{background:rgba(30,86,49,.18);border-radius:99px;}
.sc-row{display:flex;gap:9px;margin-bottom:14px;animation:sc-up .35s cubic-bezier(.2,.8,.2,1) both;}
@keyframes sc-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sc-row.user{flex-direction:row-reverse;}
.sc-mini{height:30px;width:30px;border-radius:9px;flex-shrink:0;display:grid;place-items:center;background:linear-gradient(135deg,#D4A574,#722F37 55%,#1E5631);color:#FBF4EA;font-size:13px;}
.sc-bub{max-width:80%;border-radius:16px;padding:11px 13px;font-size:14px;line-height:1.5;white-space:pre-wrap;}
.sc-bub.coach{background:#fff;color:#3D3D3D;border-bottom-left-radius:5px;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 10px 26px -18px rgba(61,61,61,.4);border:1px solid rgba(61,61,61,.05);}
.sc-bub.user{background:var(--sc-accent);color:#FBF4EA;border-bottom-right-radius:5px;}
.sc-bub strong{font-weight:600;color:#173F24;} .sc-bub.user strong{color:#fff;}
.sc-cards{margin:9px 0 0 39px;display:flex;flex-direction:column;gap:9px;}
.sc-card{background:#fff;border-radius:16px;padding:13px 14px;border:1px solid rgba(61,61,61,.06);box-shadow:0 10px 26px -20px rgba(61,61,61,.4);}
.sc-card .sc-ct{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#722F37;font-family:var(--font-jetbrains),'JetBrains Mono',monospace;}
.sc-card h5{font-family:var(--font-playfair),'Playfair Display',serif;font-size:16px;color:#0E2916;margin:3px 0 0;}
.sc-task{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#3D3D3D;padding:5px 0;cursor:pointer;}
.sc-cb{height:19px;width:19px;border-radius:6px;flex-shrink:0;display:grid;place-items:center;background:#fff;box-shadow:inset 0 0 0 1.5px rgba(30,86,49,.35);transition:.2s;margin-top:1px;}
.sc-task.done .sc-cb{background:var(--sc-accent);box-shadow:inset 0 0 0 1.5px var(--sc-accent);}
.sc-task.done .sc-cb svg{opacity:1;} .sc-cb svg{opacity:0;}
.sc-task.done span{text-decoration:line-through;color:rgba(61,61,61,.45);}
.sc-bar{height:7px;border-radius:99px;background:#EFE5D2;overflow:hidden;margin-top:9px;}
.sc-bar>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#1E5631,#D4A574);}
.sc-line{display:flex;align-items:center;justify-content:space-between;font-size:13px;padding:4px 0;border-top:1px solid rgba(61,61,61,.05);}
.sc-line:first-of-type{border-top:none;}
.sc-flag-over{color:#722F37;font-weight:600;} .sc-flag-ok{color:#1E5631;}
.sc-note{font-size:13.5px;line-height:1.6;color:#3D3D3D;white-space:pre-wrap;background:#FBF4EA;border-radius:12px;padding:11px 12px;margin-top:8px;border:1px dashed rgba(114,47,55,.25);}
.sc-vd{display:flex;align-items:center;gap:11px;}
.sc-vd .av{height:42px;width:42px;border-radius:12px;flex-shrink:0;background:radial-gradient(120% 100% at 30% 20%,#D4A574,#722F37 60%,#3D181C);}
.sc-cta{margin-top:10px;display:inline-flex;align-items:center;gap:6px;background:var(--sc-accent);color:#FBF4EA;border:none;border-radius:99px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;transition:.2s;}
.sc-cta:hover{filter:brightness(1.08);}
.sc-chips{margin:10px 0 4px 39px;display:flex;flex-wrap:wrap;gap:7px;}
.sc-chip{background:#fff;color:#173F24;border:1px solid rgba(30,86,49,.18);border-radius:99px;padding:7px 13px;font-size:12.5px;cursor:pointer;transition:.18s;text-align:left;}
.sc-chip:hover{background:var(--sc-accent);color:#FBF4EA;border-color:var(--sc-accent);}
.sc-typing span{display:inline-block;height:7px;width:7px;border-radius:99px;background:var(--sc-accent);margin:0 1.5px;animation:sc-dot 1.1s infinite;}
.sc-typing span:nth-child(2){animation-delay:.15s;} .sc-typing span:nth-child(3){animation-delay:.3s;}
@keyframes sc-dot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
.sc-welcome{padding:4px 2px;}
.sc-sug{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px;}
.sc-sgroup{background:#fff;border-radius:16px;padding:11px 12px;border:1px solid rgba(61,61,61,.06);box-shadow:0 10px 26px -22px rgba(61,61,61,.4);}
.sc-sgroup .sc-sh{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#0E2916;}
.sc-sq{display:block;width:100%;text-align:left;margin-top:7px;font-size:12px;line-height:1.35;color:#3D3D3D;background:#FBF4EA;border:none;border-radius:9px;padding:7px 9px;cursor:pointer;transition:.18s;}
.sc-sq:hover{background:var(--sc-accent);color:#FBF4EA;}
.sc-comp{flex-shrink:0;padding:11px 14px calc(11px + env(safe-area-inset-bottom));background:#FAF7F2;border-top:1px solid rgba(61,61,61,.06);}
.sc-inwrap{display:flex;align-items:flex-end;gap:7px;background:#fff;border-radius:18px;padding:6px 6px 6px 12px;box-shadow:inset 0 0 0 1px rgba(61,61,61,.1);transition:box-shadow .2s;}
.sc-inwrap:focus-within{box-shadow:inset 0 0 0 2px var(--sc-accent);}
.sc-ta{flex:1;border:none;outline:none;background:transparent;resize:none;font-family:inherit;font-size:14px;line-height:1.45;color:#3D3D3D;max-height:120px;padding:6px 0;}
.sc-tool{display:grid;place-items:center;height:34px;width:34px;border-radius:11px;border:none;background:transparent;color:#6b6b6b;cursor:pointer;transition:.2s;flex-shrink:0;}
.sc-tool:hover{background:#F4E4C1;color:#722F37;}
.sc-tool.rec{background:#722F37;color:#FBF4EA;animation:sc-rec 1.2s infinite;}
@keyframes sc-rec{0%,100%{box-shadow:0 0 0 0 rgba(114,47,55,.5)}50%{box-shadow:0 0 0 6px rgba(114,47,55,0)}}
.sc-send{display:grid;place-items:center;height:38px;width:38px;border-radius:13px;border:none;background:var(--sc-accent);color:#FBF4EA;cursor:pointer;transition:.2s;flex-shrink:0;}
.sc-send:hover{filter:brightness(1.08);} .sc-send:disabled{opacity:.4;cursor:default;filter:none;}
.sc-foot{text-align:center;font-size:10px;color:rgba(61,61,61,.4);margin-top:8px;font-family:var(--font-jetbrains),'JetBrains Mono',monospace;letter-spacing:.04em;}
.sc-hist{position:absolute;inset:0;background:#FAF7F2;z-index:5;transform:translateX(100%);transition:transform .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;}
.sc-hist.sc-on{transform:none;}
.sc-hitem{text-align:left;width:100%;background:#fff;border:1px solid rgba(61,61,61,.06);border-radius:14px;padding:12px 13px;margin-bottom:9px;cursor:pointer;transition:.2s;}
.sc-hitem:hover{box-shadow:0 12px 26px -18px rgba(61,61,61,.4);transform:translateY(-1px);}
.sc-flash{position:fixed;left:50%;transform:translateX(-50%);bottom:90px;z-index:95;background:#0E2916;color:#FBF4EA;padding:11px 18px;border-radius:99px;font-size:13px;box-shadow:0 20px 50px -20px rgba(14,41,22,.6);animation:sc-up .25s ease both;}
`;
