'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useState } from 'react'

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`rounded px-3 py-2 text-sm transition
        ${active ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-200'}`}
    >
      {label}
    </Link>
  )
}

export default function ProNav() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    try {
      const supabase = supabaseBrowser()
      await supabase.auth.signOut()
      router.replace('/pro/login')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/pro/dashboard" className="font-semibold">Psicofinders · Pro</Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/pro/dashboard" label="Dashboard" />
          <NavLink href="/pro/perfil" label="Perfil" />
          <NavLink href="/pro/honorarios" label="Honorarios" />
          <NavLink href="/pro/agenda" label="Agenda" />
          <NavLink href="/pro/preview" label="Vista previa" />
          <NavLink href="/pro/password" label="Contraseña" />
          <button
            onClick={signOut}
            className="ml-2 rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60"
            disabled={signingOut}
          >
            {signingOut ? 'Saliendo…' : 'Salir'}
          </button>
        </nav>
      </div>
    </header>
  )
}
