import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const form = await req.formData()
  const pwd = String(form.get('password') ?? '')
  const expectedHash = process.env.ADMIN_PASSWORD_HASH

  // Si falta el hash en env, vuelve al login con error
  if (!expectedHash) {
    return NextResponse.redirect(new URL('/admin/login?err=1', req.url))
  }

  const hash = createHash('sha256').update(pwd).digest('hex')
  const ok = hash === expectedHash

  // Redirige según éxito/error
  const url = new URL(ok ? '/admin' : '/admin/login?err=1', req.url)
  const res = NextResponse.redirect(url)

  // Si es correcto, setea cookie httpOnly
  if (ok) {
    res.cookies.set('admin', expectedHash, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })
  }

  return res
}
