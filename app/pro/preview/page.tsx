'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export const dynamic = 'force-dynamic'

type Modality = 'online' | 'inperson' | 'hybrid'
type Profile = {
  name: string | null
  city: string | null
  country: string | null
  langs: string[] | null
  modality: Modality | null
  price_min: number | null
  price_max: number | null
  avatar_url: string | null
  approaches: string[] | null
  specialties: string[] | null
}

export default function ProPreview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [p, setP] = useState<Profile | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = supabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        const { data, error } = await supabase
          .from('therapists')
          .select('name, city, country, langs, modality, price_min, price_max, avatar_url, approaches, specialties')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        setP((data ?? null) as Profile)
        setLoading(false)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  if (loading) return <main className="mx-auto max-w-2xl p-6">Cargando…</main>
  if (err) return <main className="mx-auto max-w-2xl p-6 text-red-700">{err}</main>
  if (!p) return <main className="mx-auto max-w-2xl p-6">Sin datos.</main>

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Vista previa</h1>
      <p className="mt-1 text-neutral-600">Así se verá tu ficha a los pacientes.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="flex gap-4 p-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border">
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt={p.name ?? 'Foto'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">Sin foto</div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold">{p.name ?? 'Profesional'}</h2>
            <p className="text-sm text-neutral-700">
              {p.city ?? '—'}{p.country ? `, ${p.country}` : ''} · {p.modality === 'inperson' ? 'Presencial' : p.modality === 'hybrid' ? 'Híbrida' : 'Online'}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              Idiomas: {(p.langs ?? []).join(', ') || '—'}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              Honorarios: {p.price_min != null ? `${p.price_min}€` : '—'} – {p.price_max != null ? `${p.price_max}€` : '—'}
            </p>
          </div>
        </div>

        {(p.specialties && p.specialties.length > 0) || (p.approaches && p.approaches.length > 0) ? (
          <div className="border-t p-4 text-sm">
            {p.specialties && p.specialties.length > 0 && (
              <p><span className="font-medium">Especialidades:</span> {p.specialties.join(', ')}</p>
            )}
            {p.approaches && p.approaches.length > 0 && (
              <p className="mt-1"><span className="font-medium">Enfoques:</span> {p.approaches.join(', ')}</p>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
