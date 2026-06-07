import { NextRequest, NextResponse } from 'next/server'
import type { SakenomyResult } from '@/lib/sakenomy'

type LiquorItem = {
  id: string
  name: string
  ruby: string
  type?: string
  display?: boolean
  brand?: { id: string; name: string }
  brewery?: { name: string }
  area?: { name: string }
}

// 個別銘柄一覧をサーバー側にキャッシュ（1時間）
let liquorCache: LiquorItem[] | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000

const STRIP_CORP = /^(株式会社|有限会社|合同会社)\s*|\s*(株式会社|有限会社|合同会社)$/g

async function fetchAllLiquors(): Promise<LiquorItem[]> {
  if (liquorCache && Date.now() - cacheTime < CACHE_TTL) return liquorCache

  const res = await fetch(
    'https://api-app.sakenomy.jp/api/Liquors/search/v3?limit=10000',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; osake-zukan/1.0)' } }
  )
  if (!res.ok) return []

  const data: LiquorItem[] = await res.json()
  // display:false の非公開商品を除外
  liquorCache = Array.isArray(data) ? data.filter(l => l.display !== false) : []
  cacheTime = Date.now()
  return liquorCache
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json([])

  try {
    const liquors = await fetchAllLiquors()
    const lower = q.toLowerCase()

    const filtered = liquors.filter(l =>
      l.name.toLowerCase().includes(lower) ||
      (l.ruby && l.ruby.toLowerCase().includes(lower))
    )

    // 前方一致を優先し、次に名前の短い順（より汎用的な銘柄を先に）
    filtered.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(lower) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(lower) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.name.length - b.name.length
    })

    // 同名重複を除去して最大20件
    const seen = new Set<string>()
    const matched = filtered
      .filter(l => {
        if (seen.has(l.name)) return false
        seen.add(l.name)
        return true
      })
      .slice(0, 20)
      .map((l): SakenomyResult => ({
        id: l.id,
        name: l.name,
        brewery: (l.brewery?.name ?? '').replace(STRIP_CORP, '').trim(),
        region: l.area?.name ?? null,
        type: l.type ?? null,
        url: `https://www.sakenomy.jp/sake/${l.id}`,
      }))

    return NextResponse.json(matched)
  } catch {
    return NextResponse.json([])
  }
}
