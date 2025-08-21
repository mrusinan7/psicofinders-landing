import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'   // evita cacheo estático
export const revalidate = 0

// GET de verificación rápida -> debe responder 200 si la ruta existe
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, method: 'GET' })
}

export async function POST(req: Request) {
  const form = await req.formData()
  const pwd = String(form.get('password') ?? '')
  const expectedHash = process.env.ADMIN_PASSWORD_HASH

  if (!expectedHash) {
    // falta la env var -> vuelve al login con error
    return NextResponse.redirect(new URL('/admin/login?err=1', req.url))
  }

  const hash = createHash('sha256').update(pwd).digest('hex')
  const ok = hash === expectedHash

  const url = new URL(ok ? '/admin' : '/admin/login?err=1', req.url)
  const res = NextResponse.redirect(url)

  if (ok) {
    // cookie httpOnly de sesión admin
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
