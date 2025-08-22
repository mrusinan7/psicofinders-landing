import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Prepara respuesta mutable para que Supabase pueda refrescar cookies
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return res // no bloquees si faltan vars

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => req.cookies.get(name)?.value,
      set: (name: string, value: string, options: any) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: any) => {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { pathname, search } = req.nextUrl
  const isLogin = pathname === '/pro/login'
  const isOnboarding = pathname.startsWith('/pro/onboarding')

  // Solo comprobamos si hay usuario
  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → sólo permitimos /pro/login y /pro/onboarding
  if (!user && !isLogin && !isOnboarding) {
    const loginUrl = new URL('/pro/login', req.url)
    const next = pathname + (search || '')
    if (next && next !== '/pro/login') loginUrl.searchParams.set('next', next)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión y en /pro/login → manda al dashboard
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/pro/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/pro/:path*'],
}
