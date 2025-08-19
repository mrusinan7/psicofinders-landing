import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
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

    const { error } = await supabaseAdmin.from('therapist_applications').insert(insert)
    if (error) throw error

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('/api/therapists error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
