'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true } }
)

export default function Onboarding() {
  const [name, setName] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/pro/login'; return }
      // nombre desde user_metadata (lo incluimos en la invitación)
      const metaName = (user.user_metadata as Record<string, unknown>)?.name
      if (typeof metaName === 'string') setName(metaName)
    })()
  }, [])

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">¡Bienvenida/o {name || ''}!</h1>
      <p className="mt-2 text-gray-700">
        Tu cuenta se ha activado. En breve podrás completar tu perfil profesional,
        disponibilidad y honorarios desde tu área privada.
      </p>
      <a href="/pro/dashboard" className="mt-6 inline-block rounded bg-black px-4 py-2 text-white">
        Ir al panel
      </a>
    </main>
  )
}
