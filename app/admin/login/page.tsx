import { redirect } from 'next/navigation'

// En Next 15, searchParams puede ser Promise<...>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminLoginPage({
  searchParams,
}: { searchParams?: SearchParams }) {
  const sp = (await searchParams) ?? {}
  const err = typeof sp.err === 'string' ? sp.err : undefined

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Acceso al backoffice</h1>
      <p className="mt-2 text-sm text-gray-600">
        Introduce la contraseña de administrador.
      </p>

      {err && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Credenciales no válidas
        </div>
      )}

      {/* Enviamos el formulario al route handler */}
      <form method="POST" action="/admin/login/authorize" className="mt-6 flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder="********"
          className="rounded border px-3 py-2"
          required
        />
        <button className="rounded bg-black px-4 py-2 text-white">Entrar</button>
      </form>
    </main>
  )
}
