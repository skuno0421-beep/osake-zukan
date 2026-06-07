export type SakenomyResult = {
  id: string
  name: string
  brewery: string
  region: string | null
  type: string | null
  url: string
}

export type SakenomyDetail = {
  feature: string | null       // 味わいの特徴
  alcohol: string | null       // アルコール度数
  acidity: string | null       // 酸度
  sakeMeterValue: string | null // 日本酒度
  ricePolishingRatio: string | null // 精米歩合
  rices: string[]              // 使用米
  type: string | null          // 特定名称
  imageUrl: string | null      // 商品画像URL
}

export async function searchSakenomy(query: string): Promise<SakenomyResult[]> {
  const res = await fetch(`/api/sakenomy?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchSakenomyDetail(id: string): Promise<SakenomyDetail | null> {
  const res = await fetch(`/api/sakenomy/detail?id=${encodeURIComponent(id)}`)
  if (!res.ok) return null
  return res.json()
}
