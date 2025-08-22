'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ProHonorariosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [min, setMin] = useState<number | ''>('')
  const [max, setMax] = useState<number | ''>('')

  useEffect(() => {
    const run = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !anon) throw new Error('Faltan variables públicas de Supabase')
        const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/pro/login'); return }

        const { data, error } = await supabase
          .from('therapists')
          .select('price_min, price_max')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        if (data?.price_min != null) setMin(Number(data.price_min))
        if (data?.price_max != null) setMax(Number(data.price_max))

        setLoading(false)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null); setOk(null)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      const pm = min === '' ? null : Number(min)
      const px = max === '' ? null : Number(max)
      if (pm != null && px != null && pm > px) throw new Error('El mínimo no puede ser mayor que el máximo.')

      const { error } = await supabase
        .from('therapists')
        .update({ price_min: pm, price_max: px })
        .eq('id', user.id)

      if (error) throw error
      setOk('Honorarios guardados.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-md p-6">Cargando…</main>

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Honorarios</h1>
      <p className="mt-1 text-gray-600">Indica tus rangos orientativos por sesión.</p>

      {err && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{err}</div>}
      {ok &&  <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-green-700 text-sm">{ok}</div>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mínimo (€)</label>
            <input
              type="number"
              min={0}
              step="1"
              className="w-full rounded border px-3 py-2"
              value={min}
              onChange={(e) => setMin(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Máximo (€)</label>
            <input
              type="number"
              min={0}
              step="1"
              className="w-full rounded border px-3 py-2"
              value={max}
              onChange={(e) => setMax(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </main>
  )
}
