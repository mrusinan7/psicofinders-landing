import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'

// En Next 15, searchParams puede ser Promise<...>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const sp = (await searchParams) ?? {}
  const err = typeof sp.err === 'string' ? sp.err : undefined

  // Server Action INLINE (no export)
  async function loginAction(formData: FormData) {
    'use server'
    const pwd = String(formData.get('password') ?? '')
    const expectedHash = process.env.ADMIN_PASSWORD_HASH
    if (!expectedHash) {
      redirect('/admin/login?err=1')
    }
    const hash = createHash('sha256').update(pwd).digest('hex')
    if (hash !== expectedHash) {
      redirect('/admin/login?err=1')
    }
    cookies().set('admin', expectedHash, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })
    redirect('/admin')
  }

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

      <form action={loginAction} className="mt-6 flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder="********"
          className="rounded border px-3 py-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Entrar</button>
      </form>
    </main>
  )
}
