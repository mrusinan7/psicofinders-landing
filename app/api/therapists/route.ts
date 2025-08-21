import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

// Pequeño ping para probar rápido en /api/therapists (GET)
export async function GET() {
  const okEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  return NextResponse.json({ ok: true, env: okEnv ? 'ok' : 'missing' })
}

export async function POST(req: Request) {
  try {
    // Comprobación de env vars (para errores típicos de Vercel)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const body = await req.json()

    // Validación mínima
    const required = ['name', 'email', 'city', 'country', 'colegiado', 'langs']
    for (const k of required) {
      if (!body?.[k] || (k === 'langs' && !Array.isArray(body.langs))) {
        return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
      }
    }

    const insert = {
      name: String(body.name).slice(0, 200),
      email: String(body.email).slice(0, 200),
      phone: body.phone ? String(body.phone).slice(0, 50) : null,
      city: String(body.city).slice(0, 120),
      country: String(body.country).slice(0, 120),
      colegiado: String(body.colegiado).slice(0, 120),
      experience: body.experience ? Number(body.experience) : null,
      website: body.website ? String(body.website).slice(0, 300) : null,
      modality: ['inperson', 'online', 'hybrid'].includes(body.modality)
        ? body.modality
        : 'inperson',
      langs: Array.isArray(body.langs) ? body.langs.map(String) : [],
      approaches: Array.isArray(body.approaches) ? body.approaches.map(String) : [],
      specialties: Array.isArray(body.specialties) ? body.specialties.map(String) : [],
      price_min: body.priceMin ? Number(body.priceMin) : null,
      price_max: body.priceMax ? Number(body.priceMax) : null,
      availability: body.availability ?? null,
      notes: body.notes ? String(body.notes) : null,
      ui_lang: body.uiLang ?? null,
      source: body.source ?? 'landing-pro-mvp',
      submitted_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('therapist_applications')
      .insert(insert)
      .select('id') // fuerza a Supabase a responder con más detalle

    if (error) {
      console.error('/api/therapists supabase error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: any) {
    console.error('/api/therapists server error', err)
    // Si el body no es JSON, capturamos el error aquí
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}