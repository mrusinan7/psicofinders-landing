'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Modality = 'online' | 'inperson' | 'hybrid'
type TherapistProfile = {
  name: string | null
  colegiado: string | null
  modality: Modality | null
  langs: string[] | null
  city: string | null
  country: string | null
  website: string | null
  phone: string | null
}

const LANG_OPTIONS = ['es', 'ca', 'en', 'fr', 'pt', 'de'] as const
const MODALITY_OPTIONS: Modality[] = ['online', 'inperson', 'hybrid']

export default function ProPerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [colegiado, setColegiado] = useState('')
  const [modality, setModality] = useState<Modality>('online')
  const [langs, setLangs] = useState<string[]>(['es'])
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !anon) throw new Error('Faltan variables públicas de Supabase')
        //const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })
		const supabase = supabaseBrowser()
		
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        const { data, error } = await supabase
          .from('therapists')
          .select('name, colegiado, modality, langs, city, country, website, phone')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        const p = (data ?? {}) as TherapistProfile
        if (p.name) setName(p.name)
        if (p.colegiado) setColegiado(p.colegiado)
        if (p.modality && MODALITY_OPTIONS.includes(p.modality)) setModality(p.modality)
        if (Array.isArray(p.langs) && p.langs.length) setLangs(p.langs)
        if (p.city) setCity(p.city)
        if (p.country) setCountry(p.country)
        if (p.website) setWebsite(p.website)
        if (p.phone) setPhone(p.phone)

        setLoading(false)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  function toggleLang(code: string) {
    setLangs(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null); setOk(null)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = supabaseBrowser()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      const { error } = await supabase
        .from('therapists')
        .update({
          name, colegiado, modality, langs,
          city: city || null,
          country: country || null,
          website: website || null,
          phone: phone || null,
        })
        .eq('id', user.id)

      if (error) throw error
      setOk('Cambios guardados.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl p-6">Cargando…</main>

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Editar perfil</h1>
      <p className="mt-1 text-gray-600">Actualiza tus datos visibles para pacientes.</p>

      {err && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{err}</div>}
      {ok &&  <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-green-700 text-sm">{ok}</div>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre y apellidos</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nº de colegiado/a</label>
          <input className="w-full rounded border px-3 py-2" value={colegiado} onChange={e=>setColegiado(e.target.value)} required />
        </div>

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Modalidad</label>
          <div className="mt-2 flex flex-wrap gap-4">
            {MODALITY_OPTIONS.map(m => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" name="modality" checked={modality===m} onChange={()=>setModality(m)} />
                <span>{m === 'online' ? 'Online' : m === 'inperson' ? 'Presencial' : 'Híbrida'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border p-3">
          <label className="block text-sm font-medium">Idiomas</label>
          <div className="mt-2 flex flex-wrap gap-4">
            {LANG_OPTIONS.map(l => (
              <label key={l} className="flex items-center gap-2">
                <input type="checkbox" checked={langs.includes(l)} onChange={()=>toggleLang(l)} />
                <span className="uppercase">{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input className="w-full rounded border px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">País</label>
            <input className="w-full rounded border px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Web</label>
            <input className="w-full rounded border px-3 py-2" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}
