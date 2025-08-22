'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Modality = 'online' | 'inperson' | 'hybrid'

export default function ProOnboardingPage() {
  const router = useRouter()

  // Campos mínimos del onboarding
  const [name, setName] = useState('')
  const [colegiado, setColegiado] = useState('')
  const [modality, setModality] = useState<Modality>('online')
  const [langs, setLangs] = useState<string[]>(['es'])

  // Estado UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos iniciales / redirecciones
  useEffect(() => {
    const run = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !anon) {
          setError('Faltan variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
          setLoading(false)
          return
        }

        const supabase = createClient(url, anon, {
          auth: { persistSession: true, flowType: 'pkce' },
        })

        // 1) Asegurar sesión
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/pro/login')
          return
        }

        // 2) Intentar precargar perfil si existe
        const { data, error: selectErr } = await supabase
          .from('therapists')
          .select('name, colegiado, modality, langs, onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        if (selectErr && selectErr.code !== 'PGRST116') { // ignora "no rows"
          setError(selectErr.message)
          setLoading(false)
          return
        }

        if (data) {
          if (data.onboarding_complete) {
            router.replace('/pro/dashboard')
            return
          }
          if (data.name) setName(data.name)
          if (data.colegiado) setColegiado(data.colegiado)
          if (data.modality && ['online','inperson','hybrid'].includes(data.modality)) {
            setModality(data.modality as Modality)
          }
          if (Array.isArray(data.langs) && data.langs.length > 0) {
            setLangs(data.langs as string[])
          }
        }

        setLoading(false)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
        setLoading(false)
      }
    }

    run()
  }, [router])

  function toggleLang(code: string) {
    setLangs((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) throw new Error('Faltan variables públicas de Supabase')

      const supabase = createClient(url, anon, {
        auth: { persistSession: true, flowType: 'pkce' },
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/pro/login')
        return
      }

      // Upsert con RLS (id = auth.uid())
      const { error: upsertErr } = await supabase
        .from('therapists')
        .upsert(
          {
            id: user.id,
            email: user.email ?? undefined,
            name,
            colegiado,
            modality,
            langs,
            onboarding_complete: true,
          },
          { onConflict: 'id' }
        )

      if (upsertErr) throw upsertErr

      router.replace('/pro/dashboard')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-xl p-6">Cargando…</main>
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Completa tu perfil</h1>
      <p className="mt-2 text-gray-600">
        Estos datos mínimos nos permiten publicar tu ficha y empezar a enviarte pacientes.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre y apellidos</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. María López Pérez"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nº de colegiado/a</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={colegiado}
            onChange={(e) => setColegiado(e.target.value)}
            placeholder="Ej. COPC 12345"
            required
          />
        </div>

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Modalidad</label>
          <div className="mt-2 flex flex-wrap gap-4">
            {(['online', 'inperson', 'hybrid'] as Modality[]).map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="modality"
                  checked={modality === m}
                  onChange={() => setModality(m)}
                />
                <span>
                  {m === 'online' ? 'Online' : m === 'inperson' ? 'Presencial' : 'Híbrida'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Idiomas de atención</label>
          <div className="mt-2 flex flex-wrap gap-4">
            {['es', 'ca', 'en', 'fr', 'pt', 'de'].map((l) => (
              <label key={l} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={langs.includes(l)}
                  onChange={() => toggleLang(l)}
                />
                <span className="uppercase">{l}</span>
              </label>
            ))}
          </div>
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
