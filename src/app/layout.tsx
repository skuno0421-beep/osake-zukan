import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ふたりのお酒図鑑',
  description: '飲んだ日本酒を記録・管理するアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-amber-50 min-h-screen">{children}</body>
    </html>
  )
}
