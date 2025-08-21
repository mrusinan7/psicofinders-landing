import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir la pantalla de login y su route handler de autorización
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    const cookieHash = req.cookies.get('admin')?.value
    const expected = process.env.ADMIN_PASSWORD_HASH
    if (!cookieHash || !expected || cookieHash !== expected) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('err', '1')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
