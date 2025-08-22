import type { ReactNode } from 'react'
import ProNav from '@/components/ProNav'
import ProFooter from '@/components/ProFooter'

export default function ProLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <ProNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {children}
      </main>
      <ProFooter />
    </div>
  )
}
