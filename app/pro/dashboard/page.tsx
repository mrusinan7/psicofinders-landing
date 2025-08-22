'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export const dynamic = 'force-dynamic'
type Modality = 'inperson' | 'online' | 'hybrid'
type Therapist = {
  id: string
  name: string | null
  email: string | null
  colegiado: string | null
  modality: Modality | null
  price_min: number | null
  price_max: number | null
  onboarding_complete?: boolean | null
  avatar_url: string | null
}

export default function ProDashboard() {
  const router = useRouter()
  const [me, setMe] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = supabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        const { data, error } = await supabase
          .from('therapists')
          .select('id,name,email,colegiado,modality,price_min,price_max,onboarding_complete,avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        if (!data?.onboarding_complete) { router.replace('/pro/onboarding'); return }
        setMe(data as Therapist)
        setLoading(false)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  if (loading) return <main className="mx-auto max-w-5xl p-6">Cargando…</main>
  if (err) return <main className="mx-auto max-w-5xl p-6 text-red-700">{err}</main>

  return (
    <main className="mx-auto max-w-5xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border bg-white">
          {me?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Hola{me?.name ? `, ${me.name}` : ''}</h1>
          <p className="text-sm text-neutral-600">Gestiona tu ficha, agenda y honorarios.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/pro/preview" className="rounded-2xl border bg-white p-4 transition hover:shadow">
          <h3 className="font-semibold">Vista previa</h3>
          <p className="mt-1 text-sm text-neutral-600">Previsualiza tu anuncio público.</p>
        </a>

        <a href="/pro/perfil" className="rounded-2xl border bg-white p-4 transition hover:shadow">
          <h3 className="font-semibold">Perfil</h3>
          <p className="mt-1 text-sm text-neutral-600">Nombre, idiomas, contacto y foto.</p>
        </a>

        <a href="/pro/honorarios" className="rounded-2xl border bg-white p-4 transition hover:shadow">
          <h3 className="font-semibold">Honorarios</h3>
          <p className="mt-1 text-sm text-neutral-600">Actualiza tus rangos por sesión.</p>
        </a>

        <a href="/pro/agenda" className="rounded-2xl border bg-white p-4 transition hover:shadow">
          <h3 className="font-semibold">Agenda</h3>
          <p className="mt-1 text-sm text-neutral-600">Franjas de disponibilidad.</p>
        </a>

        <a href="/pro/password" className="rounded-2xl border bg-white p-4 transition hover:shadow">
          <h3 className="font-semibold">Contraseña</h3>
          <p className="mt-1 text-sm text-neutral-600">Cambia tu clave de acceso.</p>
        </a>
      </div>
    </main>
  )
}
