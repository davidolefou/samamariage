import LandingNav from '@/components/marketing/LandingNav';
import WaitlistForm from '@/components/marketing/WaitlistForm';
import Reveal from '@/components/marketing/Reveal';

export const runtime = 'nodejs';

export default function Home() {
  return (
    <>
      <LandingNav />

      {/* ─────────────────────────────────────────── HERO ─── */}
      <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-sand/40 via-bone to-bone" />
          <div className="wax-bg absolute inset-0 opacity-60" />
          <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-gold-200/40 blur-3xl" />
          <div className="absolute -top-10 right-[-10%] h-[480px] w-[480px] rounded-full bg-royal-100/70 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
          {/* Copy */}
          <div className="relative lg:col-span-7">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-royal-700/10 bg-white/70 px-4 py-1.5 text-xs font-medium text-royal-800 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-royal-700 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-royal-700" />
              </span>
              <span className="font-mono tracking-tight">+500 mariées</span>
              <span className="text-ink/60">déjà sur la liste d&apos;attente</span>
            </div>

            <h1 className="reveal d1 mt-6 font-display text-[44px] font-semibold leading-[1.02] text-royal-900 sm:text-6xl lg:text-[78px]">
              Ton mariage <em className="not-italic gold-shine">sénégalais.</em>
              <br />
              Sans le{' '}
              <span className="relative">
                chaos
                <svg
                  viewBox="0 0 220 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-bordeaux"
                >
                  <path
                    d="M2 11 C 40 2, 80 14, 120 7 S 200 4, 218 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>

            <p className="reveal d2 mt-7 max-w-xl text-lg leading-relaxed text-ink/75">
              L&apos;IA qui pilote ton <strong className="text-royal-800">takk</strong>, ton{' '}
              <strong className="text-royal-800">céet</strong> et ta réception. De la première
              inspiration au dernier merci, on gère tout — en wolof, en français, et en toute
              sérénité.
            </p>

            <div className="reveal d3 mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#waitlist"
                className="group inline-flex items-center gap-2 rounded-full bg-royal-700 px-6 py-4 text-[15px] font-medium text-gold-50 shadow-glow ring-1 ring-gold-400/30 transition hover:bg-royal-800"
              >
                Rejoindre la waitlist
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 transition group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </a>
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full border border-royal-700/15 bg-white/70 px-6 py-4 text-[15px] font-medium text-royal-900 backdrop-blur hover:bg-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-royal-700" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Voir une démo · 2 min
              </a>
            </div>

            {/* Mini feedbacks défilants */}
            <div className="reveal d4 relative mt-12 max-w-xl overflow-hidden">
              <div className="absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bone to-transparent" />
              <div className="absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bone to-transparent" />
              <div className="marquee-track flex w-max gap-3">
                {[0, 1].map((dup) =>
                  (
                    [
                      ['J’ai économisé 800 000 F sur le budget', 'Awa'],
                      ['Plus aucun groupe WhatsApp', 'Khady'],
                      ['Ndawtal enfin sous contrôle', 'Maïmouna'],
                      ['J’ai dormi pendant 9 mois', 'Fatou'],
                    ] as const
                  ).map(([quote, name]) => (
                    <span
                      key={dup + name}
                      className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-ink/80 ring-1 ring-ink/5"
                    >
                      <span className="text-gold-600">★★★★★</span> « {quote} » —{' '}
                      <strong className="font-medium">{name}</strong>
                    </span>
                  )),
                )}
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative lg:col-span-5">
            <div className="float relative mx-auto w-[300px] sm:w-[340px]">
              <div className="float-slow glass absolute -left-12 top-10 z-20 hidden rounded-2xl px-3 py-2 text-xs shadow-card sm:block">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-royal-50 text-royal-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M4 12h10M4 17h14" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-royal-900">Budget IA</div>
                    <div className="font-mono text-[10px] text-ink/60">−12% vs prévu</div>
                  </div>
                </div>
              </div>
              <div
                className="float-slow glass absolute -right-10 top-40 z-20 hidden rounded-2xl px-3 py-2 text-xs shadow-card sm:block"
                style={{ animationDelay: '-3s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gold-50 text-gold-600">💍</div>
                  <div>
                    <div className="font-medium text-royal-900">Ndawtal</div>
                    <div className="font-mono text-[10px] text-ink/60">1 240 000 F reçus</div>
                  </div>
                </div>
              </div>
              <div
                className="float-slow glass absolute -right-6 bottom-12 z-20 hidden rounded-2xl px-3 py-2 text-xs shadow-card sm:block"
                style={{ animationDelay: '-6s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-bordeaux/10 text-bordeaux">✓</div>
                  <div>
                    <div className="font-medium text-royal-900">RSVP confirmés</div>
                    <div className="font-mono text-[10px] text-ink/60">312 / 400</div>
                  </div>
                </div>
              </div>

              {/* Device */}
              <div className="relative rounded-[44px] bg-royal-900 p-3 shadow-glow ring-1 ring-royal-900">
                <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-royal-900" />
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[34px] bg-bone">
                  <div className="flex items-center justify-between px-6 pt-4 text-[11px] font-medium text-royal-900">
                    <span className="font-mono">09:41</span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 16 12" className="h-3 w-3" fill="currentColor">
                        <rect x="0" y="8" width="3" height="4" rx="1" />
                        <rect x="4" y="5" width="3" height="7" rx="1" />
                        <rect x="8" y="2" width="3" height="10" rx="1" />
                        <rect x="12" y="0" width="3" height="12" rx="1" />
                      </svg>
                      <svg viewBox="0 0 24 12" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="20" height="10" rx="2" />
                        <rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor" />
                        <rect x="22" y="4" width="1.5" height="4" rx=".5" fill="currentColor" />
                      </svg>
                    </span>
                  </div>

                  <div className="px-5 pt-3 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                          Aminata · J-127
                        </div>
                        <h3 className="font-display text-[22px] leading-tight text-royal-900">
                          Sama xewël
                          <br />
                          commence ici
                        </h3>
                      </div>
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold-400 to-bordeaux ring-2 ring-white" />
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/5">
                      <div className="flex items-center justify-between font-mono text-[10px] text-ink/60">
                        <span>PROGRESSION</span>
                        <span>68%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-royal-50">
                        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-royal-700 via-gold-400 to-bordeaux" />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-royal-50 py-2">
                          <div className="font-display text-base text-royal-800">7</div>
                          <div className="text-[9px] text-ink/60">modules</div>
                        </div>
                        <div className="rounded-lg bg-gold-50 py-2">
                          <div className="font-display text-base text-gold-600">23</div>
                          <div className="text-[9px] text-ink/60">tâches</div>
                        </div>
                        <div className="rounded-lg bg-bordeaux/10 py-2">
                          <div className="font-display text-base text-bordeaux">4.2M</div>
                          <div className="text-[9px] text-ink/60">budget</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-ink/5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-royal-700 text-gold-100">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-royal-900">Sama Mood</div>
                          <div className="text-[10px] text-ink/60">18 inspirations sauvegardées</div>
                        </div>
                        <span className="font-mono text-[10px] text-gold-600">+3</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-ink/5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold-400 text-royal-900">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 12h3l3-8 4 16 3-8h5" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-royal-900">Sama Ndawtal</div>
                          <div className="text-[10px] text-ink/60">1 240 000 F · 47 contributrices</div>
                        </div>
                        <span className="font-mono text-[10px] text-royal-700">live</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-ink/5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-bordeaux text-gold-100">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <circle cx="12" cy="8" r="3" />
                            <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-royal-900">Sama Tenues</div>
                          <div className="text-[10px] text-ink/60">30 amies · ndaxal coordonné</div>
                        </div>
                        <span className="font-mono text-[10px] text-bordeaux">28/30</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-royal-900 p-3 text-gold-50">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gold-400/80">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" /> Coach Sérénité
                      </div>
                      <p className="mt-1.5 text-[11px] leading-snug">
                        Aminata, respire. Tout est sous contrôle 🌟
                        <br />
                        Tu as 4 minutes de méditation prévues à 21h.
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 mx-3 mb-3 flex items-center justify-between rounded-2xl bg-royal-900 px-4 py-3 text-gold-100">
                    <span className="h-2 w-2 rounded-full bg-gold-400" />
                    <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 12l8-8 8 8M6 10v10h12V10" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="9" r="3" />
                      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-7xl items-center gap-3 px-5 font-mono text-xs uppercase tracking-widest text-ink/50 sm:px-8">
          <div className="h-px flex-1 bg-ink/10" />
          <span>Sama Mariage, sama xewël — mon mariage, ma joie</span>
          <div className="h-px flex-1 bg-ink/10" />
        </div>
      </section>

      {/* ─────────────────────────────────────────── SOCIAL PROOF ─── */}
      <section className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">
                Vu par la communauté
              </div>
              <h2 className="mt-3 font-display text-4xl text-royal-900 sm:text-5xl">
                <span className="num-outline font-display">50K</span> futures mariées
                <br />
                nous suivent déjà.
              </h2>
              <p className="mt-4 max-w-md text-ink/70">
                Sur TikTok, Instagram, dans les salons de Sicap et les caves de Ménilmontant. Une
                seule conversation : <strong className="text-royal-800">enfin un outil qui nous comprend.</strong>
              </p>

              <div className="mt-8 grid grid-cols-3 gap-6">
                <div>
                  <div className="font-display text-3xl text-royal-800">50K+</div>
                  <div className="font-mono text-xs uppercase tracking-widest text-ink/60">vues TikTok</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-gold-600">500+</div>
                  <div className="font-mono text-xs uppercase tracking-widest text-ink/60">waitlist</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-bordeaux">12</div>
                  <div className="font-mono text-xs uppercase tracking-widest text-ink/60">pays diaspora</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-5">
                <div className="flex h-20 items-center justify-center bg-bone">
                  <span className="font-display text-lg italic text-ink/60">Senego</span>
                </div>
                <div className="flex h-20 items-center justify-center bg-bone">
                  <span className="font-mono text-sm tracking-widest text-ink/60">SENEWEB</span>
                </div>
                <div className="flex h-20 items-center justify-center bg-bone">
                  <span className="font-display text-base text-ink/60">Jeune Afrique</span>
                </div>
                <div className="flex h-20 items-center justify-center bg-bone">
                  <span className="font-sans font-bold tracking-tight text-ink/60">au-féminin</span>
                </div>
                <div className="flex h-20 items-center justify-center bg-bone">
                  <span className="font-display text-base italic text-ink/60">Teranga&nbsp;Mag</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <figure className="reveal d1 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
                  <div className="text-sm text-gold-500">★★★★★</div>
                  <blockquote className="mt-2 text-sm leading-relaxed text-ink/85">
                    « J&apos;ai testé la beta pendant 3 mois. Ma mère a arrêté de m&apos;appeler à 7h du matin. »
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-bordeaux to-gold-400" />
                    <div>
                      <div className="text-sm font-medium text-royal-900">Aïssatou D.</div>
                      <div className="text-xs text-ink/60">Mariée · Almadies, 2025</div>
                    </div>
                  </figcaption>
                </figure>
                <figure className="reveal d2 rounded-2xl bg-royal-900 p-5 text-gold-50 shadow-card">
                  <div className="text-sm text-gold-400">★★★★★</div>
                  <blockquote className="mt-2 text-sm leading-relaxed">
                    « Le Ndawtal tracking… enfin. Je sais exactement qui a donné quoi, sans cahier. »
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold-400 to-bordeaux ring-2 ring-gold-400/40" />
                    <div>
                      <div className="text-sm font-medium">Ndèye Coumba S.</div>
                      <div className="text-xs text-gold-100/70">Mariée · Paris 18ᵉ</div>
                    </div>
                  </figcaption>
                </figure>
                <figure className="reveal d3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
                  <div className="text-sm text-gold-500">★★★★★</div>
                  <blockquote className="mt-2 text-sm leading-relaxed text-ink/85">
                    « Mes 28 cousines en ndaxal coordonné, sans 15 groupes WhatsApp. Magie. »
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-royal-700 to-gold-400" />
                    <div>
                      <div className="text-sm font-medium text-royal-900">Marème B.</div>
                      <div className="text-xs text-ink/60">Future mariée · Milan</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── PROBLÈME ─── */}
      <section className="relative bg-gradient-to-b from-bone to-sand/40 py-24 sm:py-28">
        <div className="wax-bg absolute inset-0 -z-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Le problème</div>
            <h2 className="mt-3 text-balance font-display text-4xl text-royal-900 sm:text-5xl lg:text-6xl">
              Organiser ton mariage
              <br />
              te rend <em className="not-italic text-bordeaux">dingue&nbsp;?</em>
            </h2>
            <p className="mt-5 max-w-lg text-ink/70">
              Tu n&apos;es pas seule. Voici les 4 enfers qu&apos;on a entendus 1 247 fois en
              interviewant des mariées sénégalaises.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: 'N°01',
                icon: (
                  <>
                    <path d="M4 6h16v9H7l-3 3z" />
                    <path d="M8 10h8M8 13h5" />
                  </>
                ),
                title: '+15 groupes WhatsApp en simultané',
                body: 'Tata Aïda, tata Mame, le DJ, le traiteur, les 3 ndaxal… ton téléphone n’a plus de batterie après 11h.',
                stat: '73% des mariées',
                d: 'd1',
              },
              {
                n: 'N°02',
                icon: (
                  <>
                    <path d="M3 17l4-4 4 4 7-9" />
                    <path d="M14 8h6v6" />
                  </>
                ),
                title: 'Budget qui explose sans qu’on sache pourquoi',
                body: 'Tu prévois 5M. Tu finis à 9M. Et personne ne peut t’expliquer où sont passés les 4M. Classique.',
                stat: '+80% de dépassement moyen',
                d: 'd2',
              },
              {
                n: 'N°03',
                icon: (
                  <>
                    <path d="M12 3v18M3 12h18" />
                    <circle cx="12" cy="12" r="9" />
                  </>
                ),
                title: 'Ndawtal impossible à tracker',
                body: '47 enveloppes, 12 virements Orange Money, 8 cousins qui « ont déjà donné à ta tante ». Bonne chance.',
                stat: 'Le cauchemar n°1',
                d: 'd3',
              },
              {
                n: 'N°04',
                icon: (
                  <>
                    <circle cx="12" cy="7" r="3" />
                    <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
                    <circle cx="19" cy="10" r="2" />
                    <circle cx="5" cy="10" r="2" />
                  </>
                ),
                title: '30 amies, 30 tailles pour le ndaxal',
                body: 'La couturière t’envoie un vocal de 7 min toutes les 48h. Toi, tu cherches encore le numéro de Fatima.',
                stat: 'Stress garanti',
                d: 'd4',
              },
            ].map((c) => (
              <article
                key={c.n}
                className={`reveal ${c.d} group relative rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-glow`}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{c.n}</div>
                <div className="mt-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-bordeaux/10 text-bordeaux">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                    {c.icon}
                  </svg>
                </div>
                <h3 className="mt-5 font-display text-xl leading-tight text-royal-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{c.body}</p>
                <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-ink/40">
                  <span className="h-1 w-1 rounded-full bg-bordeaux" /> {c.stat}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── SOLUTION (8 modules) ─── */}
      <section id="modules" className="relative bg-bone py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-royal-700">La solution</div>
              <h2 className="mt-3 text-balance font-display text-4xl text-royal-900 sm:text-5xl lg:text-6xl">
                Tout dans une seule
                <br />
                app <em className="not-italic gold-shine">intelligente.</em>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md text-ink/70">
                8 modules qui parlent entre eux. L&apos;IA apprend ton style, ton budget, ta famille.
                Et te laisse profiter — pas piloter une PME.
              </p>
            </div>
          </div>

          <div id="how" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="reveal group relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-700 to-royal-900 p-6 text-gold-50 ring-1 ring-royal-900">
              <div className="calebasse absolute -right-8 -top-8 h-24 w-24 bg-gold-400/20 blur-xl" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/80">01 / Inspiration</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-gold-400 text-royal-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Mood</h3>
              <p className="mt-1.5 text-sm text-gold-100/85">
                Le Pinterest IA qui devine ton style en 12 questions. Mood boards générés sur mesure.
              </p>
            </article>

            <article className="reveal d1 group relative overflow-hidden rounded-3xl bg-white p-6 text-royal-900 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rotate-12 rounded-2xl bg-gold-50" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">02 / Finances</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-royal-50 text-royal-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 12h3l3-8 4 16 3-8h5" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Budget</h3>
              <p className="mt-1.5 text-sm text-ink/65">
                Le contrôleur de gestion IA qui dit non quand il faut. Alertes en temps réel.
              </p>
            </article>

            <article className="reveal d2 group relative overflow-hidden rounded-3xl bg-white p-6 text-royal-900 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="absolute right-4 top-4 font-mono text-[10px] text-ink/30">J–127</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">03 / Temps</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-bordeaux/10 text-bordeaux">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Planning</h3>
              <p className="mt-1.5 text-sm text-ink/65">
                Rétroplanning intelligent qui ajuste les tâches selon ta date, ton style et ton budget.
              </p>
            </article>

            <article className="reveal d3 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sand to-gold-50 p-6 text-royal-900 ring-1 ring-gold-200">
              <div className="calebasse absolute -left-4 -bottom-4 h-24 w-24 bg-gold-400/30" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">04 / Carnet</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-royal-700 text-gold-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Prestataires</h3>
              <p className="mt-1.5 text-sm text-ink/70">
                500+ pros vérifiés à Dakar, Thiès, Saly. Avis, dispos, devis instantanés.
              </p>
            </article>

            <article className="reveal group relative overflow-hidden rounded-3xl bg-bordeaux p-6 text-gold-50 ring-1 ring-bordeaux-900">
              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-medium text-bordeaux">
                <span className="h-1 w-1 rounded-full bg-bordeaux" /> Mondial 1ʳᵉ
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/80">05 / Tradition</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-gold-400 text-bordeaux">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 10h16M4 14h16" />
                  <path d="M8 6c0-2 2-3 4-3s4 1 4 3" />
                  <path d="M6 18c0 2 2 3 6 3s6-1 6-3" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Ndawtal</h3>
              <p className="mt-1.5 text-sm text-gold-100/85">
                Le seul outil au monde dédié au ndawtal. Don, dette, remerciement — tout est tracé.
              </p>
            </article>

            <article className="reveal d1 group relative overflow-hidden rounded-3xl bg-white p-6 text-royal-900 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">06 / Style</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-gold-50 text-gold-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 4l3 3h8l3-3M5 4l-1 6 8 10 8-10-1-6" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Tenues</h3>
              <p className="mt-1.5 text-sm text-ink/65">
                Coordination du groupe ndaxal. Tailles, paiements, livraisons. Une seule interface.
              </p>
            </article>

            <article className="reveal d2 group relative overflow-hidden rounded-3xl bg-white p-6 text-royal-900 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">07 / Réception</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-royal-50 text-royal-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 9h18" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Invités</h3>
              <p className="mt-1.5 text-sm text-ink/65">
                RSVP digital + plan de table IA qui évite Tonton Mansour à côté de Tata Codou.
              </p>
            </article>

            <article className="reveal d3 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-900 to-bordeaux p-6 text-gold-50 ring-1 ring-bordeaux/40">
              <div className="calebasse absolute -right-6 -top-6 h-24 w-24 bg-gold-400/15" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/80">08 / Toi</div>
              <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-gold-400 text-royal-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl">Sama Sérénité</h3>
              <p className="mt-1.5 text-sm text-gold-100/85">
                Coach mental IA. Méditation, journal, anti-burnout. Pour que tu profites, vraiment.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── DIASPORA ─── */}
      <section id="diaspora" className="relative overflow-hidden py-24 text-gold-50 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-bordeaux-900 via-bordeaux to-royal-900" />
        <div className="wax-bg-bordeaux absolute inset-0 -z-10 opacity-40" />
        <div className="absolute -top-20 -right-20 h-[480px] w-[480px] rounded-full bg-gold-400/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400">Sama Diaspora</div>
            <h2 className="reveal d1 mt-3 text-balance font-display text-4xl sm:text-5xl lg:text-6xl">
              Tu vis à <em className="not-italic gold-shine">Paris</em>,
              <br />
              <em className="not-italic gold-shine">New York</em> ou{' '}
              <em className="not-italic gold-shine">Milan</em>&nbsp;?
            </h2>
            <p className="reveal d2 mt-6 max-w-lg text-lg text-gold-100/85">
              Pilote ton mariage à Dakar depuis ton smartphone. Sans intermédiaire louche, sans
              transferts hasardeux, sans te demander si Tonton a vraiment payé le DJ.
            </p>

            <ul className="reveal d3 mt-10 space-y-4">
              {[
                {
                  icon: <path d="M3 12h3l3-8 4 16 3-8h5" />,
                  title: 'Transparence financière totale',
                  body: 'Chaque franc tracé. Reçus photo, virements horodatés, audit IA. Plus jamais « il a perdu le reçu ».',
                },
                {
                  icon: (
                    <>
                      <rect x="3" y="6" width="14" height="12" rx="2" />
                      <path d="m21 8-4 4 4 4z" />
                    </>
                  ),
                  title: 'Vidéos quotidiennes du terrain',
                  body: 'Ta coordinatrice envoie une vidéo de 90 sec chaque soir. Tu vois la salle, le menu, les tenues, tout.',
                },
                {
                  icon: (
                    <>
                      <circle cx="12" cy="9" r="3" />
                      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
                    </>
                  ),
                  title: 'Coordinatrice certifiée sur place',
                  body: 'Une pro Sama Mariage à Dakar, dédiée à ton mariage. Recrutée, formée, garantie.',
                },
              ].map((it) => (
                <li key={it.title} className="flex gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold-400 text-royal-900">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      {it.icon}
                    </svg>
                  </div>
                  <div>
                    <div className="font-display text-xl">{it.title}</div>
                    <p className="text-sm text-gold-100/75">{it.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <a
              href="#waitlist"
              className="reveal d4 mt-10 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-4 text-[15px] font-medium text-bordeaux-900 ring-1 ring-gold-200/50 transition hover:bg-gold-200"
            >
              Découvrir Sama Diaspora
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
          </div>

          <div className="relative lg:col-span-6">
            <div className="reveal relative mx-auto aspect-square max-w-md">
              <div className="absolute inset-0 rounded-full border border-gold-400/20" />
              <div className="absolute inset-6 rounded-full border border-gold-400/15" />
              <div className="absolute inset-12 rounded-full border border-gold-400/10" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(212,165,116,.18),transparent_60%)]" />

              {[
                { left: '18%', top: '35%', label: 'New York', delay: '0s' },
                { left: '44%', top: '30%', label: 'Paris', delay: '.4s' },
                { left: '52%', top: '42%', label: 'Milan', delay: '.8s' },
                { left: '38%', top: '60%', label: 'London', delay: '1.2s' },
              ].map((pin) => (
                <div key={pin.label} className="absolute" style={{ left: pin.left, top: pin.top }}>
                  <div className="relative">
                    <div
                      className="h-3 w-3 animate-pulse rounded-full bg-gold-400 ring-4 ring-gold-400/20"
                      style={{ animationDelay: pin.delay }}
                    />
                    <div className="absolute left-5 -top-1 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] backdrop-blur">
                      {pin.label}
                    </div>
                  </div>
                </div>
              ))}
              <div className="absolute" style={{ left: '35%', top: '50%' }}>
                <div className="relative">
                  <div className="h-5 w-5 rounded-full bg-bordeaux shadow-glow ring-4 ring-gold-400" />
                  <div className="absolute left-7 -top-1 whitespace-nowrap rounded-full bg-bordeaux/80 px-3 py-1 font-mono text-[11px] backdrop-blur">
                    Dakar 🇸🇳
                  </div>
                </div>
              </div>

              <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full opacity-60">
                <defs>
                  <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#D4A574" stopOpacity="0" />
                    <stop offset=".5" stopColor="#D4A574" />
                    <stop offset="1" stopColor="#D4A574" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M75 145 Q 110 80 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                <path d="M180 125 Q 170 95 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                <path d="M210 170 Q 200 130 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                <path d="M155 245 Q 130 240 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
              </svg>

              <div className="absolute inset-x-0 -bottom-2 text-center font-mono text-[10px] uppercase tracking-widest text-gold-400/70">
                12 pays · 1 application · 1 mariage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── PRICING ─── */}
      <section id="pricing" className="relative bg-bone py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Tarifs</div>
            <h2 className="mt-3 font-display text-4xl text-royal-900 sm:text-5xl lg:text-6xl">
              Un tarif. Pour la vie.
            </h2>
            <p className="mt-4 text-ink/70">
              Un paiement unique. Accès complet jusqu&apos;au mariage + 6 mois après. Aucun
              abonnement, aucun frais caché. Promis sur le ndawtal.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <article className="reveal d1 relative flex flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-ink/10">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">Pour budgets &lt; 5M</div>
              <h3 className="mt-2 font-display text-3xl text-royal-900">Sama Essentiel</h3>
              <div className="mt-6 flex items-end gap-1">
                <span className="font-display text-5xl text-royal-900">25 000</span>
                <span className="mb-1.5 font-mono text-sm text-ink/60">FCFA · unique</span>
              </div>
              <ul className="mt-7 flex-1 space-y-3 text-sm text-ink/75">
                <li className="flex gap-2"><span className="mt-0.5 text-royal-700">✓</span> 5 modules essentiels</li>
                <li className="flex gap-2"><span className="mt-0.5 text-royal-700">✓</span> Budget IA + Mood IA</li>
                <li className="flex gap-2"><span className="mt-0.5 text-royal-700">✓</span> 50 invités max · RSVP digital</li>
                <li className="flex gap-2"><span className="mt-0.5 text-royal-700">✓</span> Support WhatsApp 6j/7</li>
                <li className="flex gap-2 text-ink/40"><span className="mt-0.5">·</span> Coach Sérénité non inclus</li>
              </ul>
              <a
                href="#waitlist"
                className="mt-7 inline-flex justify-center rounded-full border border-royal-700/15 px-5 py-3 text-sm font-medium text-royal-900 hover:bg-royal-50"
              >
                Choisir Essentiel
              </a>
            </article>

            <article className="reveal d2 relative z-10 flex flex-col overflow-hidden rounded-3xl bg-royal-900 p-7 text-gold-50 shadow-glow ring-2 ring-gold-400 lg:scale-[1.03]">
              <div className="wax-bg-bordeaux absolute inset-0 opacity-20" />
              <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-xl bg-gold-400 px-4 py-1 text-[11px] font-medium uppercase tracking-widest text-bordeaux">
                ⭐ Le plus choisi
              </div>
              <div className="relative">
                <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-gold-400">Pour budgets 5–15M</div>
                <h3 className="mt-2 font-display text-3xl">Sama Premium</h3>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-5xl">50 000</span>
                  <span className="mb-1.5 font-mono text-sm text-gold-100/70">FCFA · unique</span>
                </div>
                <ul className="mt-7 flex-1 space-y-3 text-sm text-gold-100/90">
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Les 8 modules complets</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Ndawtal tracking illimité</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Invités illimités · Plan de table IA</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Coordination ndaxal (jusqu&apos;à 50 amies)</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Coach Sérénité quotidien</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-gold-400">✓</span> Support prioritaire 7j/7</li>
                </ul>
                <a
                  href="#waitlist"
                  className="mt-7 inline-flex justify-center rounded-full bg-gold-400 px-5 py-3 text-sm font-medium text-bordeaux-900 hover:bg-gold-200"
                >
                  Choisir Premium
                </a>
              </div>
            </article>

            <article className="reveal d3 relative flex flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-bordeaux/20">
              <div className="absolute right-5 top-5 rounded-full bg-bordeaux/10 px-2.5 py-1 text-[10px] font-medium text-bordeaux">Diaspora</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">Pour mariées à l&apos;étranger</div>
              <h3 className="mt-2 font-display text-3xl text-royal-900">Sama Diaspora</h3>
              <div className="mt-6 flex items-end gap-1">
                <span className="font-display text-5xl text-bordeaux">250 000</span>
                <span className="mb-1.5 font-mono text-sm text-ink/60">FCFA · unique</span>
              </div>
              <ul className="mt-7 flex-1 space-y-3 text-sm text-ink/75">
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Tout Premium, augmenté</li>
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Coordinatrice dédiée à Dakar</li>
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Vidéos quotidiennes terrain</li>
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Audit financier hebdomadaire</li>
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Visite finale lieu en 4K</li>
                <li className="flex gap-2"><span className="mt-0.5 text-bordeaux">✓</span> Conciergerie multilingue (FR / EN / IT)</li>
              </ul>
              <a
                href="#waitlist"
                className="mt-7 inline-flex justify-center rounded-full border border-bordeaux/30 bg-bordeaux/5 px-5 py-3 text-sm font-medium text-bordeaux hover:bg-bordeaux/10"
              >
                Choisir Diaspora
              </a>
            </article>
          </div>

          <p className="reveal mt-10 text-center font-mono text-xs uppercase tracking-widest text-ink/40">
            Paiement Orange Money · Wave · Visa · Stripe · Paypal
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────── FAQ ─── */}
      <section id="blog" className="bg-gradient-to-b from-bone to-sand/30 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="reveal text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">FAQ</div>
            <h2 className="mt-3 font-display text-4xl text-royal-900 sm:text-5xl">Questions fréquentes</h2>
          </div>

          <div className="reveal mt-12 divide-y divide-ink/10 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink/5">
            {[
              {
                q: 'Comment ça marche concrètement ?',
                a: 'Tu crées ton compte en 2 minutes. L’IA t’interview pendant 10 min pour comprendre ton style, ton budget, ta date et ta famille. Ensuite tout se débloque : mood board, planning, prestataires recommandés. Tu invites ton(ta) partenaire, ta wedding planner ou ta mère — c’est toi qui décides.',
                open: true,
              },
              {
                q: 'Et le paiement, comment ça se passe ?',
                a: 'Un seul paiement, à l’inscription. Orange Money, Wave, virement bancaire, ou carte (Visa, Mastercard, Stripe, Paypal pour la diaspora). Tu peux fractionner en 3 fois sans frais via Wave.',
              },
              {
                q: 'Mes données sont-elles sécurisées ?',
                a: 'Tes données sont chiffrées de bout en bout, hébergées à Paris (RGPD) avec backup à Dakar. Aucun partage sans ton accord explicite. Conformité CDP Sénégal + RGPD UE. Tu peux exporter ou supprimer tout en 1 clic.',
              },
              {
                q: 'L’IA comprend-elle le wolof ?',
                a: 'Oui. SamaIA a été entraînée sur 80 000 conversations wolof, français et franco-wolof. Tu peux lui parler comme à ta cousine. Le mode vocal arrive en Q3 2026.',
              },
              {
                q: 'Et après le mariage ?',
                a: 'L’app reste accessible 6 mois après le grand jour. Tu retrouves toutes les photos, tous les contacts, et surtout le récap Ndawtal — qui a donné, à qui tu dois rendre quoi. Une bénédiction pour les remerciements.',
              },
              {
                q: 'Et si je suis déjà fiancée depuis 6 mois ?',
                a: 'Sama Mariage rattrape tout. L’IA reconstruit ton planning à partir de la date, importe tes contacts WhatsApp, et te dit immédiatement ce qui est en retard. Tu peux démarrer à J-30 si tu veux — on a déjà sauvé des mariages.',
              },
            ].map((f) => (
              <details key={f.q} className="group" open={f.open}>
                <summary className="flex items-center justify-between gap-6 px-6 py-5">
                  <h3 className="font-display text-lg text-royal-900 sm:text-xl">{f.q}</h3>
                  <span className="chev grid h-8 w-8 place-items-center rounded-full bg-royal-50 text-xl leading-none text-royal-700">
                    +
                  </span>
                </summary>
                <div className="max-w-2xl px-6 pb-6 text-sm leading-relaxed text-ink/75">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── CTA / WAITLIST ─── */}
      <section id="waitlist" className="relative overflow-hidden py-24 text-gold-50 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="photo-ph absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-royal-900/95 via-royal-900/90 to-bordeaux/90" />
          <div className="wax-bg-bordeaux absolute inset-0 opacity-30" />
          <div className="absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-gold-400/15 blur-3xl" />
          <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-bordeaux/40 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] text-gold-400">
              Liste d&apos;attente · vague mai 2026
            </div>
            <h2 className="reveal d1 mt-3 text-balance font-display text-4xl sm:text-5xl lg:text-6xl">
              Prête à transformer
              <br />
              ton mariage&nbsp;?
            </h2>
            <p className="reveal d2 mt-5 max-w-lg text-lg text-gold-100/85">
              Rejoins les 500+ mariées déjà inscrites. On t&apos;envoie ton accès dès l&apos;ouverture,
              et un guide PDF offert : <em>“Les 7 pièges qui ruinent un mariage sénégalais.”</em>
            </p>

            <div className="reveal d3 mt-8 flex items-center gap-5">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-400 to-bordeaux ring-2 ring-royal-900" />
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-bordeaux to-royal-700 ring-2 ring-royal-900" />
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-royal-700 to-gold-400 ring-2 ring-royal-900" />
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-200 to-gold-600 ring-2 ring-royal-900" />
                <div className="grid h-10 w-10 place-items-center rounded-full bg-royal-900 font-mono text-[10px] ring-2 ring-gold-400">
                  +496
                </div>
              </div>
              <div className="text-sm text-gold-100/80">déjà sur la liste</div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── FOOTER ─── */}
      <footer className="bg-royal-900 text-gold-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <a href="#top" className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400">
                  <svg viewBox="0 0 32 32" className="h-5 w-5 text-royal-900" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                    <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                    <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
                  </svg>
                </span>
                <span className="font-display text-2xl text-gold-50">
                  Sama<span className="gold-shine font-semibold">Mariage</span>
                </span>
              </a>
              <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-gold-100/90">
                « Sama, le futur t&apos;appartient. »
              </p>
              <p className="mt-4 max-w-xs text-sm text-gold-100/60">
                L&apos;app qui pilote ton mariage sénégalais, de la première inspiration au dernier merci.
              </p>

              <div className="mt-7 flex items-center gap-2">
                {[
                  {
                    label: 'TikTok',
                    path: <path d="M16 3v3.6a4.4 4.4 0 0 0 4.4 4.4V14a7.4 7.4 0 0 1-4.4-1.4V17a5 5 0 1 1-5-5h.6v3.1a2 2 0 1 0 1.4 1.9V3z" />,
                  },
                  {
                    label: 'Instagram',
                    path: (
                      <>
                        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                      </>
                    ),
                  },
                  {
                    label: 'Pinterest',
                    path: <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 2 .8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.1-2.6-2.1-4.1 0-3.4 2.4-6.5 7-6.5 3.7 0 6.6 2.6 6.6 6.2 0 3.7-2.3 6.6-5.6 6.6-1.1 0-2.1-.6-2.5-1.2l-.7 2.6c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2z" />,
                  },
                  {
                    label: 'YouTube',
                    path: <path d="M23 7s-.2-1.5-.9-2.2c-.8-.9-1.7-.9-2.1-1C16.9 3.5 12 3.5 12 3.5s-4.9 0-8 .3c-.4.1-1.3.1-2.1 1C1.2 5.5 1 7 1 7S.8 8.8.8 10.6v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.9 2.2c.8.9 1.9.9 2.4 1 1.7.2 7.7.3 7.7.3s4.9 0 8.1-.3c.4-.1 1.3-.1 2.1-1 .7-.7.9-2.2.9-2.2s.2-1.8.2-3.6v-1.7C23.2 8.8 23 7 23 7zM9.7 14.4V8.1l6.3 3.2-6.3 3.1z" />,
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-gold-400 hover:text-royal-900"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      {s.path}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4 lg:col-span-8">
              {[
                { h: 'Produit', items: ['Les 8 modules', 'Tarifs', 'Sama Diaspora', 'Prestataires', 'Témoignages'] },
                { h: 'Entreprise', items: ['Notre histoire', 'L’équipe', 'Carrières', 'Presse', 'Contact'] },
                { h: 'Ressources', items: ['Le journal', 'Guide gratuit', 'Calculateur budget', 'Glossaire Ndawtal', 'Aide'] },
                { h: 'Légal', items: ['CGU', 'Confidentialité', 'RGPD / CDP', 'Cookies', 'Mentions légales'] },
              ].map((col) => (
                <div key={col.h}>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-gold-400">{col.h}</div>
                  <ul className="mt-4 space-y-2.5 text-gold-100/75">
                    {col.items.map((it) => (
                      <li key={it}>
                        <a href="#" className="hover:text-gold-400">
                          {it}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="henna-line mt-14" />

          <div className="mt-6 flex flex-col items-center justify-between gap-3 font-mono text-xs text-gold-100/60 sm:flex-row">
            <div>© 2026 SamaMariage SAS · Tous droits réservés</div>
            <div className="flex items-center gap-2">
              Made with <span className="text-bordeaux">❤</span> in Dakar, Sénégal 🇸🇳
            </div>
          </div>
        </div>
      </footer>

      <Reveal />
    </>
  );
}
