'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/lib/useApi';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

interface PublicVendor {
  id: string;
  category: VendorCategory;
  businessName: string;
  city: string;
  serviceAreas: string[];
  services: string[];
  capacity: number;
  priceFrom: number;
  priceLabel: string;
  description: string;
  portfolio: string[];
  coverVariant: string;
  responseTime: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  whatsapp: string;
}

function QuoteModal({ vendor, onClose }: { vendor: PublicVendor; onClose: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      await api('/api/quote-requests', {
        method: 'POST',
        body: {
          vendorId: vendor.id,
          budget: parseInt(budget.replace(/\D/g, ''), 10) || 0,
          message: message.trim(),
          detail: vendor.services.slice(0, 3).join(', '),
          eventDate: eventDate || undefined,
        },
      });
      toast('Demande envoyée — réponse sous quelques heures 📨', 'success');
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast('Connecte-toi pour envoyer une demande', 'info');
        router.push('/login');
        return;
      }
      toast('Envoi impossible', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-royal-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-[8vh] w-[min(480px,94vw)] rounded-3xl bg-paper p-6 shadow-glow ring-1 ring-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Demande de devis</div>
        <h2 className="mt-1 font-display text-2xl text-royal-900">{vendor.businessName}</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Date du mariage</span>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Budget estimé (FCFA)</span>
            <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="900000" className="mt-1.5 h-11 w-full rounded-xl bg-bone px-3 font-mono text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Message</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je me marie le… et je cherche…" className="mt-1.5 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={send} disabled={sending} className="flex-1 rounded-full bg-royal-700 py-3 text-[14px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">{sending ? 'Envoi…' : 'Envoyer la demande'}</button>
          <button onClick={onClose} className="rounded-full bg-paper px-5 py-3 text-[14px] font-medium text-ink/65 ring-1 ring-ink/10 transition hover:bg-bone">Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function PublicVendorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { user } = useAuth();
  const { data, loading, error } = useApi<{ ok: boolean; vendor: PublicVendor }>(`/api/vendors/${id}`);
  const [quoting, setQuoting] = useState(false);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }
  if (error || !data?.vendor) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone px-6 text-center">
        <div>
          <p className="font-display text-2xl text-royal-900">Prestataire introuvable</p>
          <Link href="/prestataires" className="mt-3 inline-block text-sm font-medium text-royal-700 hover:text-royal-900">← Retour à la marketplace</Link>
        </div>
      </main>
    );
  }
  const v = data.vendor;
  const wa = v.whatsapp ? `https://wa.me/${v.whatsapp.replace(/[^\d]/g, '')}` : null;

  return (
    <main className="min-h-screen bg-bone pb-28">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-bone/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
              <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" /><path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" /><path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" /></svg>
            </span>
            <span className="font-display text-[19px] leading-none"><span className="text-royal-700">Sama</span><span className="gold-shine font-semibold">Mariage</span></span>
          </Link>
          <Link href={user ? '/prestataires' : '/'} className="text-[13px] text-ink/65 hover:text-royal-800">← Marketplace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[920px] px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-3xl bg-paper shadow-card ring-1 ring-ink/5">
          <div className={'ph h-52 sm:h-64 ' + (v.coverVariant || 'cv-photo')} />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl text-royal-900">{v.businessName}</h1>
              {v.verified && <svg viewBox="0 0 16 16" className="h-5 w-5 text-royal-700" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink/60">
              <span className="font-mono text-[11px] uppercase tracking-widest text-bordeaux">{CATEGORY_LABELS[v.category]}</span>
              <span>📍 {v.city}</span>
              {v.reviewCount > 0 && <span className="font-medium text-royal-900">★ {v.rating} <span className="text-ink/45">({v.reviewCount} avis)</span></span>}
            </div>
            {v.description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/75">{v.description}</p>}
          </div>
        </section>

        {v.services.length > 0 && (
          <section className="mt-5 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Prestations</div>
            <div className="mt-3 flex flex-wrap gap-2">{v.services.map((s) => <span key={s} className="rounded-full bg-royal-700/10 px-3 py-1 text-[12px] text-royal-800">{s}</span>)}</div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-ink/70">
              <span className="font-display text-2xl text-royal-900">{fmtFCFA(v.priceFrom)} F</span>
              {v.priceLabel && <span className="text-ink/55">{v.priceLabel}</span>}
              {v.responseTime && <span>· réponse <span className="font-mono text-royal-900">{v.responseTime}</span></span>}
            </div>
          </section>
        )}

        {v.portfolio.length > 0 && (
          <section className="mt-5 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Portfolio</div>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {v.portfolio.map((url) => (
                <img key={url} src={url} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-ink/5" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Barre d'action fixe */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/5 bg-bone/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[920px] items-center gap-2 px-4 py-3 sm:px-6">
          <button onClick={() => setQuoting(true)} className="flex-1 rounded-full bg-royal-700 py-3 text-[14px] font-medium text-gold-50 transition hover:bg-royal-800">Demander un devis</button>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-3 text-[14px] font-medium text-white transition hover:opacity-90">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z" /></svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {quoting && <QuoteModal vendor={v} onClose={() => setQuoting(false)} />}
    </main>
  );
}
