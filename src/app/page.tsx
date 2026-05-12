export default function HomePage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-screen px-4"
      style={{ background: 'linear-gradient(135deg, #1E5631 0%, #2d7a47 50%, #D4A574 100%)' }}>
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
          SamaMariage
        </h1>
        <p className="text-xl mb-2 opacity-90">
          L&apos;IA qui organise ton mariage sénégalais.
        </p>
        <p className="text-lg opacity-75 mb-8">
          Budget · Prestataires · Ndawtal · Tenues — tout en un.
        </p>
        <div className="inline-block bg-white/20 rounded-xl px-6 py-3 text-sm font-medium">
          Sprint 0 terminé — Setup production-ready
        </div>
      </div>
    </main>
  )
}
