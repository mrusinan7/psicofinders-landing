import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Modality = 'inperson' | 'online' | 'hybrid'

type RequiredKeys = 'name' | 'email' | 'city' | 'country' | 'colegiado' | 'langs'

export async function GET() {
  const hasSrv =
    Boolean(process.env.SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const hasSite = Boolean(process.env.SITE_URL)
  return NextResponse.json({ ok: true, env: { supabase: hasSrv, site: hasSite } })
}

export async function POST(req: Request) {
  try {
    // Comprobación de env vars críticas
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const raw = (await req.json()) as unknown
    const body = (raw ?? {}) as Record<string, unknown>

    // Validación mínima de campos requeridos
    const required: RequiredKeys[] = ['name', 'email', 'city', 'country', 'colegiado', 'langs']
    for (const key of required) {
      if (key === 'langs') {
        if (!Array.isArray(body.langs) || (body.langs as unknown[]).length === 0) {
          return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 })
        }
      } else if (!body[key]) {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 })
      }
    }

    // Normalización segura
    const name = String(body.name).slice(0, 200)
    const email = String(body.email).slice(0, 200)
    const phone = body.phone ? String(body.phone).slice(0, 50) : null
    const city = String(body.city).slice(0, 120)
    const country = String(body.country).slice(0, 120)
    const colegiado = String(body.colegiado).slice(0, 120)

    const experience =
      typeof body.experience === 'number'
        ? body.experience
        : typeof body.experience === 'string' && body.experience.trim() !== ''
        ? Number(body.experience)
        : null

    const website = body.website ? String(body.website).slice(0, 300) : null

    const modalityRaw = String(body.modality ?? 'inperson')
    const modality: Modality = (['inperson', 'online', 'hybrid'] as const).includes(
      modalityRaw as Modality
    )
      ? (modalityRaw as Modality)
      : 'inperson'

    const langs = Array.isArray(body.langs) ? body.langs.map((x) => String(x)) : []
    const approaches = Array.isArray(body.approaches) ? body.approaches.map((x) => String(x)) : []
    const specialties = Array.isArray(body.specialties) ? body.specialties.map((x) => String(x)) : []

    const price_min =
      typeof body.priceMin === 'number'
        ? body.priceMin
        : typeof body.priceMin === 'string' && body.priceMin.trim() !== ''
        ? Number(body.priceMin)
        : null

    const price_max =
      typeof body.priceMax === 'number'
        ? body.priceMax
        : typeof body.priceMax === 'string' && body.priceMax.trim() !== ''
        ? Number(body.priceMax)
        : null

    const availability = 'availability' in body ? body.availability : null
    const notes = body.notes ? String(body.notes) : null
    const ui_lang = body.uiLang ? String(body.uiLang) : 'es'
    const source = body.source ? String(body.source) : 'landing-pro-mvp'
    const submitted_at = new Date().toISOString()

    // 1) Guardar la solicitud en DB
    const { error: dbError } = await supabaseAdmin
      .from('therapist_applications')
      .insert({
        name,
        email,
        phone,
        city,
        country,
        colegiado,
        experience,
        website,
        modality,
        langs,
        approaches,
        specialties,
        price_min,
        price_max,
        availability,
        notes,
        ui_lang,
        source,
        submitted_at,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('/api/therapists insert error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 2) Enviar invitación de Supabase (usando tu SMTP configurado en Auth → Email)
    if (process.env.AUTO_INVITE_PROS !== 'false') {
	  const site = process.env.SITE_URL ?? ''
	  const redirectTo = site ? `${site.replace(/\/$/, '')}/auth/callback` : undefined

	  const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
		redirectTo,
		data: {
		  name,
		  colegiado,
		  city,
		  country,
		  modality,
		  langs,
		  source,
		},
	  })
	  if (inviteErr) console.error('inviteUserByEmail error', inviteErr)
	}

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('/api/therapists server error', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
