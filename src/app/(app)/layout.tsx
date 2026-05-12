import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#f8f6f2' }}>
      {children}
      <Toaster position="bottom-center" richColors />
    </div>
  )
}
