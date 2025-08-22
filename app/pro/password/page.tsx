'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export const dynamic = 'force-dynamic'

export default function ProPasswordPage() {
  const router = useRouter()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    try {
      if (p1.length < 8) throw new Error('Mínimo 8 caracteres.')
      if (p1 !== p2) throw new Error('Las contraseñas no coinciden.')
      setSaving(true)
      const supabase = supabaseBrowser()
      const { error } = await supabase.auth.updateUser({ password: p1 })
      if (error) throw error
      setOk('Contraseña actualizada.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Cambiar contraseña</h1>
      <p className="mt-1 text-neutral-600">Actualiza tu clave de acceso.</p>

      {err && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok &&  <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={p1} onChange={e=>setP1(e.target.value)} minLength={8} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Repite la contraseña</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={p2} onChange={e=>setP2(e.target.value)} minLength={8} required />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={() => router.push('/pro/dashboard')} className="rounded border px-4 py-2">
            Volver al dashboard
          </button>
        </div>
      </form>
    </section>
  )
}
