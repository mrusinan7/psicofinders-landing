import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export default async function AdminHome() {
  const { data, error } = await supabaseAdmin
    .from('therapist_applications')
    .select(
      'id,submitted_at,name,email,city,country,colegiado,modality,langs,price_min,price_max'
    )
    .order('submitted_at', { ascending: false })
    .limit(200)

  if (error) {
    return <div className="p-6 text-red-700">Error cargando datos</div>
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitudes de alta (últimas 200)</h1>
        <a href="/admin/export" className="rounded bg-black px-4 py-2 text-white">
          Descargar CSV
        </a>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-3 py-2 text-left">Fecha</th>
              <th className="border px-3 py-2 text-left">Nombre</th>
              <th className="border px-3 py-2 text-left">Email</th>
              <th className="border px-3 py-2 text-left">Ciudad</th>
              <th className="border px-3 py-2 text-left">País</th>
              <th className="border px-3 py-2 text-left">Colegiación</th>
              <th className="border px-3 py-2 text-left">Modalidad</th>
              <th className="border px-3 py-2 text-left">Idiomas</th>
              <th className="border px-3 py-2 text-left">Precio (€)</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">
                  {new Date(r.submitted_at).toLocaleString('es-ES', {
                    timeZone: 'Europe/Madrid',
                  })}
                </td>
                <td className="border px-3 py-2">{r.name}</td>
                <td className="border px-3 py-2">{r.email}</td>
                <td className="border px-3 py-2">{r.city}</td>
                <td className="border px-3 py-2">{r.country}</td>
                <td className="border px-3 py-2">{r.colegiado}</td>
                <td className="border px-3 py-2 uppercase">{r.modality}</td>
                <td className="border px-3 py-2">
                  {Array.isArray(r.langs) ? r.langs.join(', ') : ''}
                </td>
                <td className="border px-3 py-2">
                  {r.price_min ?? '?'}–{r.price_max ?? '?'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
