// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Protege rutas /pro/** con Supabase:
 * - Si no hay sesión: redirige a /pro/login?next=<ruta>
 * - Si hay sesión pero falta onboarding: redirige a /pro/onboarding
 * - Evita bucles en /pro/login y /pro/onboarding
 */

export async function middleware(req: NextRequest) {
  // Prepara una respuesta (necesaria para que Supabase pueda refrescar cookies)
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Si faltan variables, no bloquees el sitio pero muestra cabecera para depurar.
    res.headers.set('x-middleware-missing-supabase', '1')
    return res
  }

  // Crea el cliente de Supabase usando las cookies (Edge-safe)
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { pathname, search } = req.nextUrl

  // Rutas públicas dentro de /pro/**
  const isLogin = pathname === '/pro/login'
  const isOnboarding = pathname.startsWith('/pro/onboarding')

  // 1) Estado de sesión
  const { data: { user } } = await supabase.auth.getUser()

  // 2) Si NO hay sesión y la ruta es privada (todo /pro/** excepto /pro/login y /pro/onboarding):
  if (!user && !isLogin && !isOnboarding) {
    const loginUrl = new URL('/pro/login', req.url)
    const next = pathname + (search || '')
    if (next && next !== '/pro/login') loginUrl.searchParams.set('next', next)
    return NextResponse.redirect(loginUrl)
  }

  // 3) Si HAY sesión y estás en /pro/login → vete al dashboard
  if (user && isLogin) {
    const dash = new URL('/pro/dashboard', req.url)
    return NextResponse.redirect(dash)
  }

  // 4) Si HAY sesión, forzar pasar por onboarding antes de otras rutas /pro/**
  if (user && !isOnboarding) {
    try {
      // RLS: cada pro solo ve su propia fila
      const { data, error } = await supabase
        .from('therapists')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data && data.onboarding_complete === false) {
        const obUrl = new URL('/pro/onboarding', req.url)
        return NextResponse.redirect(obUrl)
      }
    } catch {
      // Si falla la consulta (tabla no existe, etc.), deja pasar para no bloquear
    }
  }

  // OK → pasa a la ruta solicitada
  return res
}

/**
 * Aplica el middleware SOLO a /pro/** (no toca el resto de rutas)
 * Puedes añadir '/admin/:path*' si quieres proteger admin también.
 */
export const config = {
  matcher: ['/pro/:path*'],
}
