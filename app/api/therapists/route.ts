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

    // 1) Guardar la solicitud (como antes)
    const { error: dbError } = await supabaseAdmin
      .from('therapist_applications')
      .insert(insert)
      .select('id')
      .single()

    if (dbError) {
      console.error('/api/therapists supabase insert error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 2) Crear/registrar el usuario generando un link de "signup"
    if (process.env.AUTO_INVITE_PROS !== 'false') {
      const site = process.env.SITE_URL ?? ''
      const redirectTo = site ? `${site.replace(/\/$/, '')}/pro/onboarding` : undefined

      // Esto CREA el usuario (estado: no confirmado) y devuelve el enlace de alta
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: insert.email,
        options: {
          redirectTo,
          data: {
            name: insert.name,
            colegiado: insert.colegiado,
            city: insert.city,
            country: insert.country,
            modality: insert.modality,
            langs: insert.langs,
            source: insert.source,
          },
        },
      })

      if (linkErr) {
        console.error('generateLink(signup) error', linkErr)
        // seguimos sin romper el alta
      } else {
        const actionLink = (linkData?.properties as { action_link?: string } | null)?.action_link
        // 3) Si tienes Resend configurado, enviamos nosotros el email (entregabilidad top)
        const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL)
        if (actionLink && hasResend) {
          try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)

            const html =
              `<div style="font-family:system-ui,Arial,sans-serif">
                <h2>¡Bienvenida/o a Psicofinders, ${insert.name}!</h2>
                <p>Para activar tu cuenta y crear tu contraseña, pulsa este botón:</p>
                <p><a href="${actionLink}" style="display:inline-block;padding:10px 16px;background:#000;color:#fff;border-radius:8px;text-decoration:none">Crear contraseña</a></p>
                <p>Si no puedes hacer clic, copia y pega esta URL:<br>${actionLink}</p>
              </div>`

            const { error: resendErr } = await resend.emails.send({
              from: process.env.FROM_EMAIL!,
              to: insert.email,
              subject: 'Activa tu cuenta de profesional en Psicofinders',
              html,
              text: `Activa tu cuenta: ${actionLink}`,
            })
            if (resendErr) console.error('Resend send error', resendErr)
          } catch (e) {
            console.error('Resend import/send failed', e)
          }
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
