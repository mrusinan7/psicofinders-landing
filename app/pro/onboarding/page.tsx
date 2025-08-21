'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Modality = 'inperson' | 'online' | 'hybrid'

export default function ProOnboarding() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [colegiado, setColegiado] = useState('')
  const [modality, setModality] = useState<Modality>('online')
  const [langs, setLangs] = useState<string[]>(['es'])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) { setErr('Faltan variables públicas'); return }
      const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      // Prefill (si ya existe fila)
      const { data } = await supabase
        .from('therapists')
        .select('name, colegiado, modality, onboarding_complete, langs')
        .eq('id', user.id).maybeSingle()

      if (data) {
        setName(data.name ?? '')
        setColegiado(data.colegiado ?? '')
        if (data.modality) setModality(data.modality as Modality)
        if (Array.isArray(data.langs) && data.langs.length) setLangs(data.langs as string[])
        if (data.onboarding_complete) router.replace('/pro/dashboard')
      }
    })()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/pro/login'); return }

    // upsert del perfil + marcar onboarding_complete
    const { error } = await supabase
      .from('therapists')
      .upsert({
        id: user.id,               // IMPORTANTE para pasar RLS
        name,
        colegiado,
        modality,
        langs,
        onboarding_complete: true,
        email: user.email ?? undefined, // opcional: guarda email
      }, { onConflict: 'id' })

    setSaving(false)
    if (error) { setErr(error.message); return }

    router.replace('/pro/dashboard')
  }

  function toggleLang(v: string) {
    setLangs((prev) => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Completa tu perfil</h1>
      <p className="mt-2 text-gray-600">Estos datos mínimos son necesarios para mostrarte a pacientes.</p>
      {err && <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Nombre y apellidos" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" placeholder="Nº de colegiado" value={colegiado} onChange={e=>setColegiado(e.target.value)} required />

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Modalidad</label>
          <div className="mt-2 flex gap-3">
            {(['online','inperson','hybrid'] as Modality[]).map(m => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" name="modality" checked={modality===m} onChange={()=>setModality(m)} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Idiomas</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {['es','ca','en','fr'].map(l => (
              <label key={l} className="flex items-center gap-2">
                <input type="checkbox" checked={langs.includes(l)} onChange={()=>toggleLang(l)} />
                <span>{l.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar y continuar'}
        </button>
      </form>
    </main>
  )
}
