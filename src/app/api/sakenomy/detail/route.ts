import { NextRequest, NextResponse } from 'next/server'
import type { SakenomyDetail } from '@/lib/sakenomy'

const TYPE_MAP: Record<string, string> = {
  JunmaiDaiginjo: '純米大吟醸',
  Daiginjo: '大吟醸',
  JunmaiGinjo: '純米吟醸',
  Ginjo: '吟醸',
  Junmai: '純米',
  Honjozo: '本醸造',
  Futsu: '普通酒',
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json(null, { status: 400 })

  try {
    const res = await fetch(
      `https://api-app.sakenomy.jp/api/Liquors/${encodeURIComponent(id)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; osake-zukan/1.0)' } }
    )
    if (!res.ok) return NextResponse.json(null, { status: 404 })

    const data = await res.json()

    const detail: SakenomyDetail = {
      feature: data.feature ?? null,
      alcohol: data.alcohol && data.alcohol !== '-' ? data.alcohol : null,
      acidity: data.acidity && data.acidity !== '-' ? data.acidity : null,
      sakeMeterValue: data.sakeMeterValue && data.sakeMeterValue !== '-' ? data.sakeMeterValue : null,
      ricePolishingRatio: data.ricePolishingRatio && data.ricePolishingRatio !== '-' ? data.ricePolishingRatio : null,
      rices: Array.isArray(data.rices) ? data.rices : [],
      type: data.type ?? (data.typeCode ? (TYPE_MAP[data.typeCode] ?? null) : null),
      imageUrl: data.wholeImageUrl ?? data.labelImageUrl ?? null,
    }

    return NextResponse.json(detail)
  } catch {
    return NextResponse.json(null, { status: 500 })
  }
}
