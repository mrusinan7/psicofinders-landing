'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
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

    // Aseguramos PKCE en el cliente
    const supabase = createClient(url, anon, {
      auth: { persistSession: true, flowType: 'pkce' }
    })

    ;(async () => {
      try {
        // Errores enviados por el proveedor/GoTrue
        const errParam = sp.get('error')
        const errDesc = sp.get('error_description')
        if (errParam) {
          setMsg(`Error: ${errDesc || errParam}`)
          return
        }

        // PKCE moderno: ?code=...
        const code = sp.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          router.replace('/pro/onboarding')
          return
        }

        // Fallback: enlaces antiguos con tokens en el hash (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const params = new URLSearchParams(window.location.hash.slice(1))
          const access_token = params.get('access_token') || ''
          const refresh_token = params.get('refresh_token') || ''
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error
            router.replace('/pro/onboarding')
            return
          }
        }

        setMsg('Enlace inválido o caducado.')
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e)
        setMsg(`Error al completar el inicio de sesión: ${m}`)
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
