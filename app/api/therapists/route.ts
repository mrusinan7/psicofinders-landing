import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Modality = 'inperson' | 'online' | 'hybrid'
type RequiredKeys = 'name' | 'email' | 'city' | 'country' | 'colegiado' | 'langs'

function normInt(x: unknown): number | null {
  if (typeof x === 'number') return x
  if (typeof x === 'string' && x.trim() !== '') return Number(x)
  return null
}

export async function GET() {
  const envOk = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  const siteOk = Boolean(process.env.SITE_URL)
  return NextResponse.json({ ok: true, env: { supabase: envOk, site: siteOk } })
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const raw = (await req.json()) as unknown
    const body = (raw ?? {}) as Record<string, unknown>

    // Validación mínima
    const required: RequiredKeys[] = ['name', 'email', 'city', 'country', 'colegiado', 'langs']
    for (const k of required) {
      if (k === 'langs') {
        if (!Array.isArray(body.langs) || (body.langs as unknown[]).length === 0) {
          return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
        }
      } else if (!body[k]) {
        return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
      }
    }

    // Normalización
    const name = String(body.name).slice(0, 200)
    const email = String(body.email).slice(0, 200)
    const phone = body.phone ? String(body.phone).slice(0, 50) : null
    const city = String(body.city).slice(0, 120)
    const country = String(body.country).slice(0, 120)
    const colegiado = String(body.colegiado).slice(0, 120)
    const experience = normInt(body.experience)
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

    const price_min = normInt(body.priceMin)
    const price_max = normInt(body.priceMax)

    const availability = 'availability' in body ? body.availability : null
    const notes = body.notes ? String(body.notes) : null
    const ui_lang = body.uiLang ? String(body.uiLang) : 'es'
    const source = body.source ? String(body.source) : 'landing-pro-mvp'
    const submitted_at = new Date().toISOString()

    // 1) Guardar solicitud
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

    // 2) Invitación / fallback
    let invited: 'invite' | 'otp' | 'skipped' | 'error' = 'skipped'
    let detail: string | undefined
    let actionLink: string | undefined

    if (process.env.AUTO_INVITE_PROS !== 'false') {
      const site = process.env.SITE_URL ?? ''
      const redirectTo = site ? `${site.replace(/\/$/, '')}/auth/callback` : undefined

      // a) Intento principal: INVITE (crea usuario + email por tu SMTP)
      const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { name, colegiado, city, country, modality, langs, source },
      })

      if (!inviteErr) {
        invited = 'invite'
      } else {
        detail = `inviteUserByEmail: ${inviteErr.message}`

        // b) Fallback universal: MAGIC LINK (crea usuario si no existe y envía email)
        const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        })
        if (!otpErr) {
          invited = 'otp'
        } else {
          detail += ` | signInWithOtp: ${otpErr.message}`

          // c) Último recurso: generar action_link (sin enviar) para depurar
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: { redirectTo },
          })
          if (!linkErr) {
            actionLink = (linkData?.properties as { action_link?: string } | null)?.action_link
          } else {
            detail += ` | generateLink(invite): ${linkErr.message}`
          }

          invited = 'error'
        }
      }
    }

    const debugPayload =
      process.env.DEBUG_INVITES === 'true'
        ? { detail, actionLink }
        : undefined

    return NextResponse.json({ ok: true, invited, debug: debugPayload }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('/api/therapists server error', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
