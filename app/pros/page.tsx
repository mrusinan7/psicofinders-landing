'use client'

import React, { useMemo, useRef, useState } from 'react'

/* =========================
   Tipos
========================= */
type Modality = 'inperson' | 'online' | 'hybrid'
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type LangKey = 'es' | 'ca' | 'en' | 'fr'

interface Availability {
  mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean
  from: string; to: string
}

interface FormState {
  name: string
  email: string
  phone: string
  city: string
  country: string
  colegiado: string
  experience: string
  website: string
  modality: Modality
  langs: LangKey[]
  approaches: string[]
  specialties: string[]
  priceMin: string
  priceMax: string
  availability: Availability
  notes: string
  consent: boolean
  honey: string
}

/* =========================
   Config
========================= */
const FORM_ENDPOINT = '/api/therapists'

/* =========================
   Datos UI
========================= */
const APPROACHES = ['TCC', 'EMDR', 'ACT', 'Sistémica', 'Psicodinámica', 'Humanista', 'Gestalt', 'Mindfulness']
const SPECIALTIES = [
  'Ansiedad', 'Estado de ánimo / Depresión', 'Trauma', 'Pareja / Familia', 'Infanto-juvenil',
  'Adicciones', 'Duelo', 'TDAH', 'Identidad / Diversidad', 'Estrés laboral',
]
const LANGS: { key: LangKey; label: string }[] = [
  { key: 'es', label: 'ES' }, { key: 'ca', label: 'CA' }, { key: 'en', label: 'EN' }, { key: 'fr', label: 'FR' },
]

const dayKeys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const dayLabels: Record<DayKey, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
}

const INITIAL_FORM: FormState = {
  name: '', email: '', phone: '', city: '', country: 'España', colegiado: '', experience: '', website: '',
  modality: 'inperson', langs: ['es'], approaches: [], specialties: [],
  priceMin: '', priceMax: '',
  availability: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false, from: '09:00', to: '19:00' },
  notes: '', consent: false, honey: '',
}

/* =========================
   Pequeños componentes
========================= */
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full border px-3 py-1 text-sm">{children}</span>
}

interface CheckboxProps { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }
function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={checked}
        onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; requiredLabel?: boolean }
function Input({ label, requiredLabel, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label} {requiredLabel && <span className="text-red-600">*</span>}</label>
      <input {...props} className="rounded-xl border px-3 py-2 focus:outline-none focus:ring" />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label: string; requiredLabel?: boolean }
function Select({ label, requiredLabel, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label} {requiredLabel && <span className="text-red-600">*</span>}</label>
      <select {...props} className="rounded-xl border px-3 py-2 focus:outline-none focus:ring">{children}</select>
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; requiredLabel?: boolean }
function Textarea({ label, requiredLabel, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label} {requiredLabel && <span className="text-red-600">*</span>}</label>
      <textarea {...props} className="min-h-[90px] rounded-xl border px-3 py-2 focus:outline-none focus:ring" />
    </div>
  )
}

/* =========================
   Página
========================= */
export default function TherapistSignupLanding() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function toggleArray(key: 'approaches' | 'specialties', value: string): void
  function toggleArray(key: 'langs', value: LangKey): void
  function toggleArray(key: 'approaches' | 'specialties' | 'langs', value: string | LangKey) {
    setForm((f) => {
      if (key === 'langs') {
        const list = new Set(f.langs); const v = value as LangKey
        if (list.has(v)) list.delete(v); else list.add(v)
        return { ...f, langs: Array.from(list) }
      }
      if (key === 'approaches') {
        const list = new Set(f.approaches); const v = value as string
        if (list.has(v)) list.delete(v); else list.add(v)
        return { ...f, approaches: Array.from(list) }
      }
      const list = new Set(f.specialties); const v = value as string
      if (list.has(v)) list.delete(v); else list.add(v)
      return { ...f, specialties: Array.from(list) }
    })
  }

  const isValid = useMemo(() => {
    if (!form.name || !form.email || !form.city || !form.country || !form.colegiado) return false
    if (!form.consent) return false
    if (!form.langs.length) return false
    if (form.honey) return false
    return true
  }, [form])

  const payload = useMemo(() => ({
    ...form,
    submittedAtISO: new Date().toISOString(),
    uiLang: 'es',
    source: 'landing-pro-mvp',
  }), [form])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isValid) return
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setStatus('ok')
      formRef.current?.reset()
      setForm(INITIAL_FORM)
    } catch (err) {
      console.error(err)
      setStatus('err')
      alert(`No se pudo enviar: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* NAV */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black font-bold text-white">P</div>
          <span className="text-lg font-semibold">Psicofinders</span>
        </div>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#como-funciona" className="hover:underline">Cómo funciona</a>
          <a href="#ventajas" className="hover:underline">Ventajas</a>
          <a href="#form" className="rounded-full bg-black px-4 py-2 text-white">Alta</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-8 md:grid-cols-2 md:py-16">
        {/* Texto SIEMPRE primero (móvil y desktop) */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Únete a Psicofinders</h1>
          <p className="mt-4 text-lg text-gray-700">
            Te enviamos pacientes que encajan con tu perfil, honorarios y disponibilidad.
            Verificamos colegiación y priorizamos el ajuste ético y logístico.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>Pacientes cualificados</Badge>
            <Badge>Verificación colegiación</Badge>
            <Badge>Control de agenda</Badge>
          </div>
          <a href="#form" className="mt-8 inline-block rounded-2xl bg-black px-6 py-3 text-white">Quiero apuntarme</a>
        </div>

        {/* Visual: aparece DESPUÉS en móvil, a la derecha en desktop */}
        <div>
          <div className="rounded-3xl border bg-white p-6 shadow-md">
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.slice(0, 6).map((s) => (
                <div key={s} className="rounded-xl bg-gray-50 p-3 text-sm">{s}</div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gray-900 p-4 text-white">
              <div className="text-sm opacity-90">Ejemplo de recomendación</div>
              <div className="mt-1 text-xl font-semibold">Paciente · Ansiedad · ES/CA · Online</div>
              <div className="mt-2 text-sm opacity-80">Ventana: 18:00–20:00 (Europe/Madrid)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold">Cómo funciona Psicofinders</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-gray-500">Paso 1</div>
            <div className="text-base font-semibold">Cuestionario del paciente</div>
            <p className="mt-1 text-sm text-gray-600">Motivo de consulta, idioma, modalidad, franja horaria y rango de honorarios.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-gray-500">Paso 2</div>
            <div className="text-base font-semibold">Matching ético y logístico</div>
            <p className="mt-1 text-sm text-gray-600">Filtramos por colegiación, especialidad, idiomas, agenda y presupuesto.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-gray-500">Paso 3</div>
            <div className="text-base font-semibold">Revisión y verificación</div>
            <p className="mt-1 text-sm text-gray-600">Validamos nº de colegiado y requisitos mínimos de práctica segura.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-gray-500">Paso 4</div>
            <div className="text-base font-semibold">Contacto</div>
            <p className="mt-1 text-sm text-gray-600">Recibes la solicitud y decides aceptar o no el caso según tu criterio.</p>
          </div>
        </div>
      </section>

      {/* VENTAJAS */}
      <section id="ventajas" className="mx-auto w-full max-w-6xl px-4 py-6">
        <h2 className="text-2xl font-bold">Ventajas para profesionales</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-base font-semibold">Pacientes cualificados</div>
            <p className="mt-1 text-sm text-gray-600">Solicitudes filtradas por idioma, modalidad y honorarios: menos entrevistas improductivas.</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-base font-semibold">Verificación y confianza</div>
            <p className="mt-1 text-sm text-gray-600">Comprobamos colegiación y criterios mínimos para practicar con seguridad.</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-base font-semibold">Control y transparencia</div>
            <p className="mt-1 text-sm text-gray-600">Define especialidades, disponibilidad y honorarios. Tú decides qué casos aceptar.</p>
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section id="form" className="mx-auto w-full max-w-5xl rounded-3xl border bg-white px-4 py-8 shadow-sm md:px-8">
        <h2 className="text-2xl font-bold">Alta de profesionales</h2>
        <p className="mt-1 text-sm text-gray-600">
          Psicofinders no presta servicios de emergencia ni realiza diagnóstico clínico. En caso de urgencia, llama al 112.
        </p>

        <form ref={formRef} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {/* honeypot */}
          <input type="text" autoComplete="off" value={form.honey}
            onChange={(e) => handleChange('honey', e.currentTarget.value)} className="hidden" tabIndex={-1} aria-hidden="true" />

          <Input label="Nombre y apellidos *" requiredLabel placeholder="María López"
            value={form.name} onChange={(e) => handleChange('name', e.currentTarget.value)} />

          <Input label="Email profesional *" requiredLabel type="email" placeholder="nombre@clinica.com"
            value={form.email} onChange={(e) => handleChange('email', e.currentTarget.value)} />

          <Input label="Teléfono (opcional)" type="tel" placeholder="+34 6XX XX XX XX"
            value={form.phone} onChange={(e) => handleChange('phone', e.currentTarget.value)} />

          <Input label="Ciudad / Provincia *" requiredLabel placeholder="Barcelona"
            value={form.city} onChange={(e) => handleChange('city', e.currentTarget.value)} />

          <Input label="País *" requiredLabel placeholder="España"
            value={form.country} onChange={(e) => handleChange('country', e.currentTarget.value)} />

          <Input label="Nº de colegiación (COP) *" requiredLabel placeholder="COPC XXXXX"
            value={form.colegiado} onChange={(e) => handleChange('colegiado', e.currentTarget.value)} />

          <Input label="Años de experiencia" type="number" min={0} placeholder="5"
            value={form.experience} onChange={(e) => handleChange('experience', e.currentTarget.value)} />

          <Input label="Web o LinkedIn (opcional)" placeholder="https://…"
            value={form.website} onChange={(e) => handleChange('website', e.currentTarget.value)} />

          <Select label="Modalidad de atención *" requiredLabel value={form.modality}
            onChange={(e) => handleChange('modality', e.currentTarget.value as Modality)}>
            <option value="inperson">Presencial</option>
            <option value="online">Online</option>
            <option value="hybrid">Híbrida</option>
          </Select>

          {/* Idiomas */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">Idiomas de atención <span className="text-red-600">*</span></label>
            <div className="mt-2 flex flex-wrap gap-3">
              {LANGS.map(({ key, label }) => (
                <Checkbox key={key} id={`lang-${key}`} label={label}
                  checked={form.langs.includes(key)} onChange={() => toggleArray('langs', key)} />
              ))}
            </div>
          </div>

          {/* Enfoques */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">Enfoques terapéuticos</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {APPROACHES.map((a) => (
                <Checkbox key={a} id={`ap-${a}`} label={a}
                  checked={form.approaches.includes(a)} onChange={() => toggleArray('approaches', a)} />
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">Especialidades</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SPECIALTIES.map((s) => (
                <Checkbox key={s} id={`sp-${s}`} label={s}
                  checked={form.specialties.includes(s)} onChange={() => toggleArray('specialties', s)} />
              ))}
            </div>
          </div>

          {/* Precio */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio por sesión — Mínimo (€)" type="number" min={0} placeholder="40"
              value={form.priceMin} onChange={(e) => handleChange('priceMin', e.currentTarget.value)} />
            <Input label="Precio por sesión — Máximo (€)" type="number" min={0} placeholder="90"
              value={form.priceMax} onChange={(e) => handleChange('priceMax', e.currentTarget.value)} />
          </div>

          {/* Disponibilidad */}
          <div className="col-span-1 rounded-2xl border p-4 md:col-span-2">
            <div className="text-sm font-medium">Disponibilidad semanal</div>
            <div className="mt-3 flex flex-wrap gap-4">
              {dayKeys.map((d) => (
                <Checkbox key={d} id={`day-${d}`} label={dayLabels[d]}
                  checked={form.availability[d]}
                  onChange={(v) => setForm((f) => ({ ...f, availability: { ...f.availability, [d]: v } }))} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Desde" type="time" value={form.availability.from}
                onChange={(e) => setForm((f) => ({ ...f, availability: { ...f.availability, from: e.currentTarget.value } }))} />
              <Input label="Hasta" type="time" value={form.availability.to}
                onChange={(e) => setForm((f) => ({ ...f, availability: { ...f.availability, to: e.currentTarget.value } }))} />
            </div>
          </div>

          <Textarea className="md:col-span-2" label="Notas (opcional)"
            placeholder="Breve presentación, preferencias de casos, etc."
            value={form.notes} onChange={(e) => handleChange('notes', e.currentTarget.value)} />

          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <input id="consent" type="checkbox" className="mt-1"
                checked={form.consent} onChange={(e) => handleChange('consent', e.currentTarget.checked)} />
              <label htmlFor="consent" className="text-sm">
                He leído y acepto la Política de Privacidad
              </label>
            </div>
            <p className="text-xs text-gray-500">GDPR/LOPDGDD: minimización de datos; cifrado en tránsito; eliminación bajo solicitud.</p>
          </div>

          <div className="md:col-span-2">
            <button type="submit" disabled={!isValid}
              className={`w-full rounded-2xl px-6 py-3 text-white transition ${isValid ? 'bg-black hover:opacity-90' : 'bg-gray-400'}`}>
              Enviar solicitud
            </button>
            {status === 'ok' && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-green-900">
                ¡Gracias! Hemos recibido tu solicitud.
              </div>
            )}
            {status === 'err' && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                Error al enviar. Revisa los campos o inténtalo de nuevo.
              </div>
            )}
          </div>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto mt-10 w-full max-w-6xl px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Psicofinders</div>
          <div className="flex flex-wrap gap-4">
            <a href="/privacidad" className="underline">Privacidad</a>
            <a href="/terminos" className="underline">Términos</a>
            <span className="opacity-75">Europe/Madrid</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
