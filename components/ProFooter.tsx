import Link from 'next/link'

export default function ProFooter() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <p className="text-sm text-neutral-600">© {new Date().getFullYear()} Psicofinders</p>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-700">
          <Link href="/legal/privacidad" className="hover:underline">Privacidad</Link>
          <Link href="/legal/terminos" className="hover:underline">Términos</Link>
          <Link href="/legal/cookies" className="hover:underline">Cookies</Link>
          <Link href="/contacto" className="hover:underline">Contacto</Link>
        </nav>
      </div>
    </footer>
  )
}
