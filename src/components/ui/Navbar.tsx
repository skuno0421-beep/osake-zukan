'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/sake', label: '一覧' },
    { href: '/map', label: '地図' },
  ]

  return (
    <nav className="bg-amber-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/sake" className="font-bold text-lg tracking-wide">🍶 ふたりのお酒図鑑</Link>
        <div className="flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium hover:text-amber-200 transition ${pathname.startsWith(href) ? 'text-amber-200 underline underline-offset-4' : ''}`}
            >
              {label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-sm hover:text-amber-200 transition">ログアウト</button>
        </div>
      </div>
    </nav>
  )
}
