import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const okEnv = Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SITE_URL
  )
  return NextResponse.json({ ok: true, env: okEnv ? 'ok' : 'missing' })
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const body = await req.json()

    // Validación mínima
    const required = ['name', 'email', 'city', 'country', 'colegiado', 'langs'] as const
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
      modality: ['inperson', 'online', 'hybrid'].includes(body.modality) ? body.modality : 'inperson',
      langs: Array.isArray(body.langs) ? body.langs.map(String) : [],
      approaches: Array.isArray(body.approaches) ? body.approaches.map(String) : [],
      specialties: Array.isArray(body.specialties) ? body.specialties.map(String) : [],
      price_min: body.priceMin ? Number(body.priceMin) : null,
      price_max: body.priceMax ? Number(body.priceMax) : null,
      availability: body.availability ?? null,
      notes: body.notes ? String(body.notes) : null,
      ui_lang: body.uiLang ?? 'es',
      source: body.source ?? 'landing-pro-mvp',
      submitted_at: new Date().toISOString(),
    }

    // 1) Guardar la solicitud
    const { error: dbError } = await supabaseAdmin
      .from('therapist_applications')
      .insert(insert)
      .select('id')
      .single()

    if (dbError) {
      console.error('/api/therapists supabase insert error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 2) (Opcional) Invitar automáticamente a crear contraseña y acceder al área privada
    if (process.env.AUTO_INVITE_PROS !== 'false') {
      const site = process.env.SITE_URL ?? ''
      const redirectTo = site ? `${site}/pro/onboarding` : undefined

      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(insert.email, {
        // redirige tras aceptar la invitación
        redirectTo,
        // metadatos útiles para pre-rellenar el onboarding
        data: {
          name: insert.name,
          colegiado: insert.colegiado,
          city: insert.city,
          country: insert.country,
          modality: insert.modality,
          langs: insert.langs,
          source: insert.source,
        },
      })

      if (inviteError) {
        const msg = inviteError.message ?? ''
        // Si el usuario ya existe, no consideramos esto como error fatal
        const already = /already.*(registered|exist)/i.test(msg)
        if (!already) {
          console.error('inviteUserByEmail error', inviteError)
          // No rompemos el flujo del alta
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('/api/therapists server error', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}