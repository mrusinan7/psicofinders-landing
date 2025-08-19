import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('therapist_applications')
    .select(
      'submitted_at,name,email,phone,city,country,colegiado,experience,website,modality,langs,approaches,specialties,price_min,price_max,availability,notes,ui_lang,source'
    )
    .order('submitted_at', { ascending: false })
    .limit(1000)

  if (error) {
    return new Response('error', { status: 500 })
  }

  const header = [
    'submitted_at',
    'name',
    'email',
    'phone',
    'city',
    'country',
    'colegiado',
    'experience',
    'website',
    'modality',
    'langs',
    'approaches',
    'specialties',
    'price_min',
    'price_max',
    'availability',
    'notes',
    'ui_lang',
    'source',
  ]

  const rows = (data || []).map((r: any) => [
    r.submitted_at,
    r.name,
    r.email,
    r.phone ?? '',
    r.city,
    r.country,
    r.colegiado,
    r.experience ?? '',
    r.website ?? '',
    r.modality,
    Array.isArray(r.langs) ? r.langs.join('|') : '',
    Array.isArray(r.approaches) ? r.approaches.join('|') : '',
    Array.isArray(r.specialties) ? r.specialties.join('|') : '',
    r.price_min ?? '',
    r.price_max ?? '',
    r.availability ? JSON.stringify(r.availability) : '',
    String(r.notes || '').replace(/\n/g, ' ').slice(0, 1000),
    r.ui_lang ?? '',
    r.source ?? '',
  ])

  const csv = [header, ...rows]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=therapists_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    },
  })
}
