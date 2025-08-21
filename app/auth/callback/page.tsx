'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function CallbackInner() {
  const [msg, setMsg] = useState('Completando inicio de sesión…')
  const router = useRouter()
  const sp = useSearchParams()

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      setMsg('Faltan variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: true, flowType: 'pkce' },
    })

    ;(async () => {
      try {
        // 1) Errores directos en la URL (?error=...)
        const errParam = sp.get('error')
        const errDesc = sp.get('error_description')
        if (errParam) throw new Error(errDesc || errParam)

        // 2) PKCE (?code=...)
        const code = sp.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          // 3) Fragmento con tokens (#access_token=...&refresh_token=...)
          const hash = typeof window !== 'undefined' ? window.location.hash : ''
          if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.replace(/^#/, ''))
            const access_token = params.get('access_token') || ''
            const refresh_token = params.get('refresh_token') || ''
            if (!access_token || !refresh_token) {
              throw new Error('Faltan tokens en el enlace.')
            }
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error

            // limpia el hash de la URL
            if (typeof window !== 'undefined') {
              const clean = window.location.pathname + window.location.search
              window.history.replaceState({}, document.title, clean)
            }
          } else {
            throw new Error('Enlace inválido o caducado.')
          }
        }

        // 4) Decide destino según onboarding
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No se pudo crear la sesión')

        const { data, error } = await supabase
          .from('therapists')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error

        const complete = data?.onboarding_complete === true
        router.replace(complete ? '/pro/dashboard' : '/pro/onboarding')
      } catch (e) {
        const pretty =
          e instanceof Error
            ? e.message
            : typeof e === 'string'
            ? e
            : JSON.stringify(e)
        setMsg(`Error al completar el inicio de sesión: ${pretty}`)
      }
    })()
  }, [router, sp])

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Autenticación</h1>
      <p className="mt-3 text-gray-700">{msg}</p>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md p-6">
          <h1 className="text-xl font-semibold">Autenticación</h1>
          <p className="mt-3 text-gray-700">Completando inicio de sesión…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
