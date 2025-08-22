'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

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
  avatar_url: string | null
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = supabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        const { data, error } = await supabase
          .from('therapists')
          .select('name, colegiado, modality, langs, city, country, website, phone, avatar_url')
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
        if (p.avatar_url) setAvatarUrl(p.avatar_url)

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

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = pub.publicUrl

      const { error: updErr } = await supabase
        .from('therapists')
        .update({ avatar_url: url })
        .eq('id', user.id)

      if (updErr) throw updErr
      setAvatarUrl(url)
      setOk('Imagen de perfil actualizada.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null); setOk(null)
    try {
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

  if (loading) return <main className="mx-auto max-w-3xl p-6">Cargando…</main>

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <p className="mt-1 text-neutral-600">Actualiza tus datos visibles para pacientes.</p>

      {err && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok &&  <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <div className="mt-6 grid gap-6 md:grid-cols-[240px,1fr]">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="h-32 w-32 overflow-hidden rounded-full border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                  Sin foto
                </div>
              )}
            </div>
            <label className="inline-block cursor-pointer rounded border px-3 py-1 text-sm">
              {uploading ? 'Subiendo…' : 'Subir imagen'}
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre y apellidos</label>
              <input className="w-full rounded border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nº de colegiado/a</label>
              <input className="w-full rounded border px-3 py-2" value={colegiado} onChange={e=>setColegiado(e.target.value)} required />
            </div>
          </div>

          <div className="mt-4 rounded border p-3">
            <label className="block text-sm font-medium">Modalidad</label>
            <div className="mt-2 flex flex-wrap gap-4">
              {MODALITY_OPTIONS.map(m => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="modality" checked={modality===m} onChange={()=>setModality(m)} />
                  <span>{m==='online'?'Online':m==='inperson'?'Presencial':'Híbrida'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded border p-3">
            <label className="block text-sm font-medium">Idiomas</label>
            <div className="mt-2 flex flex-wrap gap-4">
              {LANG_OPTIONS.map(l => (
                <label key={l} className="flex items-center gap-2">
                  <input type="checkbox" checked={langs.includes(l)} onChange={()=>setLangs(prev=>prev.includes(l)?prev.filter(x=>x!==l):[...prev,l])} />
                  <span className="uppercase">{l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Ciudad</label>
              <input className="w-full rounded border px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">País</label>
              <input className="w-full rounded border px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Web</label>
              <input className="w-full rounded border px-3 py-2" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <input className="w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="submit" disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => router.push('/pro/dashboard')} className="rounded border px-4 py-2">
              Volver al dashboard
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
