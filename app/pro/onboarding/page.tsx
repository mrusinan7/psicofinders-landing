'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Modality = 'online' | 'inperson' | 'hybrid'
type Meta = Partial<{
  name: string
  colegiado: string
  modality: Modality
  langs: string[]
  city: string
  country: string
}>

export default function ProOnboardingSetPassword() {
  const router = useRouter()
  const [msg, setMsg] = useState('Preparando tu cuenta…')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Datos que vienen del formulario inicial (NO editables aquí)
  const [seed, setSeed] = useState<{
    name: string
    colegiado: string
    modality: Modality
    langs: string[]
    city: string
    country: string
  } | null>(null)

  // Formulario de contraseña
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !anon) throw new Error('Faltan variables públicas de Supabase')

        const supabase = createClient(url, anon, {
          auth: { persistSession: true, flowType: 'pkce' },
        })

        // 1) Sesión
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        // 2) Si ya está completo → panel
        const { data: profile } = await supabase
          .from('therapists')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.onboarding_complete) { router.replace('/pro/dashboard'); return }

        // 3) Construir “semilla” desde user_metadata o última solicitud por email
        const meta = (user.user_metadata || {}) as Meta
        let name = meta.name ?? ''
        let colegiado = meta.colegiado ?? ''
        let modality: Modality | undefined = meta.modality
        let langs: string[] | undefined = Array.isArray(meta.langs) ? meta.langs : undefined
        let city = meta.city ?? ''
        let country = meta.country ?? ''

        const needMore =
          !name || !colegiado || !modality || !(langs && langs.length) || !city || !country

        if (needMore && user.email) {
          const { data: app } = await supabase
            .from('therapist_applications')
            .select('name, colegiado, modality, langs, city, country')
            .eq('email', user.email)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (app) {
            if (!name && app.name) name = app.name
            if (!colegiado && app.colegiado) colegiado = app.colegiado
            if (!modality && app.modality && ['online','inperson','hybrid'].includes(app.modality)) {
              modality = app.modality as Modality
            }
            if ((!langs || !langs.length) && Array.isArray(app.langs) && app.langs.length) {
              langs = app.langs as string[]
            }
            if (!city && app.city) city = app.city
            if (!country && app.country) country = app.country
          }
        }

        // Defaults seguros
        if (!modality) modality = 'online'
        if (!langs || !langs.length) langs = ['es']

        setSeed({
          name,
          colegiado,
          modality,
          langs,
          city,
          country,
        })
        setLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!seed) return
    setSaving(true); setError(null)

    try {
      if (p1.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
      if (p1 !== p2) throw new Error('Las contraseñas no coinciden.')

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      // 1) Establecer contraseña para el usuario actual (requiere Email+Password habilitado)
      const { error: pwErr } = await supabase.auth.updateUser({ password: p1 })
      if (pwErr) throw pwErr

      // 2) Crear/actualizar el perfil con la semilla y marcar onboarding_complete
      const { error: upsertErr } = await supabase
        .from('therapists')
        .upsert(
          {
            id: user.id,                         // RLS: id = auth.uid()
            email: user.email ?? undefined,
            name: seed.name,
            colegiado: seed.colegiado,
            modality: seed.modality,
            langs: seed.langs,
            city: seed.city,
            country: seed.country,
            onboarding_complete: true,
          },
          { onConflict: 'id' }
        )
      if (upsertErr) throw upsertErr

      // 3) Al panel
      router.replace('/pro/dashboard')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-xl p-6">Cargando…</main>

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Crea tu contraseña</h1>
      <p className="mt-2 text-gray-600">
        Tu cuenta ya está verificada. Crea una contraseña para acceder cuando quieras.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resumen de datos (solo lectura) */}
      {seed && (
        <div className="mt-5 rounded-lg border p-3 text-sm text-gray-700">
          <p><strong>Nombre:</strong> {seed.name || '—'}</p>
          <p><strong>Colegiado:</strong> {seed.colegiado || '—'}</p>
          <p><strong>Modalidad:</strong> {seed.modality}</p>
          <p><strong>Idiomas:</strong> {seed.langs.join(', ')}</p>
          <p><strong>Ciudad/Pais:</strong> {seed.city || '—'} {seed.country || ''}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Repite la contraseña</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar y continuar'}
        </button>
      </form>
    </main>
  )
}
