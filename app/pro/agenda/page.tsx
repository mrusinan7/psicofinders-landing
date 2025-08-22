'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Slot = { start: string; end: string }
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type Availability = Record<DayKey, Slot[]>

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo'
}

const EMPTY_AVAIL: Availability = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

export default function ProAgendaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [avail, setAvail] = useState<Availability>(EMPTY_AVAIL)

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
          .select('availability')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        const a = (data?.availability ?? {}) as Partial<Availability>
        setAvail({
          mon: a.mon ?? [],
          tue: a.tue ?? [],
          wed: a.wed ?? [],
          thu: a.thu ?? [],
          fri: a.fri ?? [],
          sat: a.sat ?? [],
          sun: a.sun ?? [],
        })

        setLoading(false)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      }
    }
    run()
  }, [router])

  function addSlot(day: DayKey) {
    setAvail(prev => {
      const curr = prev[day]
      if (curr.length >= 3) return prev
      const next: Slot[] = [...curr, { start: '09:00', end: '13:00' }]
      return { ...prev, [day]: next }
    })
  }

  function updateSlot(day: DayKey, idx: number, field: 'start' | 'end', value: string) {
    setAvail(prev => {
      const next = prev[day].map((s, i) => i === idx ? { ...s, [field]: value } : s)
      return { ...prev, [day]: next }
    })
  }

  function removeSlot(day: DayKey, idx: number) {
    setAvail(prev => {
      const next = prev[day].filter((_, i) => i !== idx)
      return { ...prev, [day]: next }
    })
  }

  function isValidRange(s: Slot): boolean {
    // formato HH:MM y start < end
    const re = /^\d{2}:\d{2}$/
    if (!re.test(s.start) || !re.test(s.end)) return false
    return s.start < s.end
  }

  async function onSave() {
    setSaving(true); setErr(null); setOk(null)
    try {
      // Validación básica
      for (const d of Object.keys(avail) as DayKey[]) {
        for (const s of avail[d]) {
          if (!isValidRange(s)) throw new Error(`Revisa los horarios de ${DAY_LABELS[d]}`)
        }
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(url, anon, { auth: { persistSession: true, flowType: 'pkce' } })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/pro/login'); return }

      const { error } = await supabase
        .from('therapists')
        .update({ availability: avail })
        .eq('id', user.id)

      if (error) throw error
      setOk('Disponibilidad guardada.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl p-6">Cargando…</main>

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-1 text-gray-600">Configura tus días y franjas disponibles (máx. 3 por día).</p>

      {err && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{err}</div>}
      {ok &&  <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-green-700 text-sm">{ok}</div>}

      <div className="mt-6 space-y-5">
        {(Object.keys(DAY_LABELS) as DayKey[]).map(day => (
          <div key={day} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{DAY_LABELS[day]}</h3>
              <button
                type="button"
                onClick={() => addSlot(day)}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                disabled={avail[day].length >= 3}
              >
                Añadir franja
              </button>
            </div>

            {avail[day].length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">Sin franjas</p>
            ) : (
              <div className="mt-2 space-y-2">
                {avail[day].map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label className="text-sm">De</label>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                      className="rounded border px-2 py-1"
                      required
                    />
                    <label className="text-sm">a</label>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(day, idx, 'end', e.target.value)}
                      className="rounded border px-2 py-1"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(day, idx)}
                      className="ml-auto text-sm text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar agenda'}
        </button>
      </div>
    </main>
  )
}
