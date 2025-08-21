'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Evita SSG/ISR en Next 15 para esta ruta
export const dynamic = 'force-dynamic'

type Therapist = {
  id: string
  name: string | null
  email: string | null
  colegiado: string | null
  modality: 'inperson' | 'online' | 'hybrid' | null
  price_min: number | null
  price_max: number | null
}

export default function ProDashboard() {
  const router = useRouter()
  const [me, setMe] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      setErr('Faltan variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
      setLoading(false)
      return
    }

    const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })

    ;(async () => {
      // 1) Asegura sesión
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      // 2) Carga perfil con RLS (cada pro solo su fila)
      const { data, error } = await supabase
        .from('therapists')
        .select('id,name,email,colegiado,modality,price_min,price_max')
        .eq('id', user.id)
        .maybeSingle()

      if (error) setErr(error.message)
      else setMe((data as Therapist) ?? null)

      setLoading(false)
    })()
  }, [router])

  async function signOut() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return
    const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })
    await supabase.auth.signOut()
    router.replace('/pro/login')
  }

  if (loading) return <main className="mx-auto max-w-2xl p-6">Cargando…</main>
  if (err) return <main className="mx-auto max-w-2xl p-6 text-red-700">Error: {err}</main>

  const { data, error } = await supabase
	.from('therapists')
	.select('onboarding_complete, name, email, colegiado, modality, price_min, price_max')
	.eq('id', user.id)
	.maybeSingle()

  if (!data?.onboarding_complete) { router.replace('/pro/onboarding'); return }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel profesional</h1>
        <button onClick={signOut} className="rounded bg-black px-3 py-2 text-white">Salir</button>
      </div>

      {!me ? (
        <div className="mt-4 rounded border p-4">
          <h2 className="font-semibold">Aún no tienes perfil</h2>
          <p className="text-sm text-gray-600">
            Completa tu información para que podamos mostrarte a pacientes.
          </p>
          <a className="mt-3 inline-block rounded bg-black px-4 py-2 text-white" href="/pro/onboarding">
            Empezar onboarding
          </a>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <h3 className="font-semibold">Datos principales</h3>
            <p className="text-sm text-gray-700 mt-2">
              {me.name} · {me.email}<br />
              Colegiado: {me.colegiado ?? '—'}<br />
              Modalidad: {me.modality ?? '—'}
            </p>
            <a className="mt-3 inline-block rounded border px-3 py-2" href="/pro/perfil">Editar perfil</a>
          </div>

          <div className="rounded-2xl border p-4">
            <h3 className="font-semibold">Honorarios</h3>
            <p className="text-sm text-gray-700 mt-2">
              {me.price_min ? `${me.price_min}€` : '—'} – {me.price_max ? `${me.price_max}€` : '—'}
            </p>
            <a className="mt-3 inline-block rounded border px-3 py-2" href="/pro/honorarios">Editar honorarios</a>
          </div>

          <div className="rounded-2xl border p-4">
            <h3 className="font-semibold">Disponibilidad</h3>
            <p className="text-sm text-gray-700 mt-2">Configura tus días y franjas de visita.</p>
            <a className="mt-3 inline-block rounded border px-3 py-2" href="/pro/agenda">Editar agenda</a>
          </div>
        </div>
      )}
    </main>
  )
}
