import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteButton from '@/components/sake/DeleteButton'
import type { SakeRecord, Profile } from '@/types/database'

const RATING_STARS = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)

const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) =>
  value != null ? (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  ) : null

export default async function SakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: sake }, { data: { user } }] = await Promise.all([
    supabase.from('sake_records').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])
  if (!sake) notFound()

  const sakeRecord = sake as SakeRecord
  const isOwner = user?.id === sakeRecord.user_id

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', sakeRecord.user_id)
    .single()
  const authorName = (profile as Pick<Profile, 'display_name'> | null)?.display_name ?? '不明'

  // Sakenomy 味わいの特徴を取得（直接外部APIを呼ぶ）
  let sakenomyFeature: string | null = null
  if (sakeRecord.sakenomy_id) {
    try {
      const res = await fetch(
        `https://api-app.sakenomy.jp/api/Liquors/${encodeURIComponent(sakeRecord.sakenomy_id)}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; osake-zukan/1.0)' },
          next: { revalidate: 3600 },
        }
      )
      if (res.ok) {
        const data = await res.json()
        sakenomyFeature = data.feature ?? null
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/sake" className="text-sm text-amber-700 hover:underline">← 一覧に戻る</Link>
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/sake/${sakeRecord.id}/edit`}
              className="text-sm px-3 py-1.5 border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 transition">
              編集
            </Link>
            <DeleteButton id={sakeRecord.id} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {sakeRecord.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sakeRecord.photo_url} alt={sakeRecord.name} className="w-full max-h-96 object-contain bg-gray-50 p-4" />
        ) : (
          <div className="w-full h-56 bg-amber-100 flex items-center justify-center text-6xl">🍶</div>
        )}
        <div className="p-5">
          <h1 className="text-2xl font-bold text-amber-900">{sakeRecord.name}</h1>
          <p className="text-gray-500 mb-1">{sakeRecord.brewery}</p>
          <p className="text-amber-500 text-lg mb-4">{RATING_STARS(sakeRecord.rating)}</p>

          <div className="space-y-0">
            <Row label="飲んだ日付" value={sakeRecord.drunk_at} />
            <Row label="種類" value={sakeRecord.type} />
            <Row label="産地" value={sakeRecord.region} />
            <Row label="使用米" value={sakeRecord.rice} />
            <Row label="精米歩合" value={sakeRecord.seimaibuai != null ? `${sakeRecord.seimaibuai}%` : null} />
            <Row label="アルコール度数" value={sakeRecord.alcohol != null ? `${sakeRecord.alcohol}%` : null} />
            <Row label="日本酒度" value={sakeRecord.sake_meter} />
            <Row label="酸度" value={sakeRecord.acidity} />
            <Row label="飲んだ場所" value={sakeRecord.location} />
            <Row label="金額" value={sakeRecord.price != null ? `¥${sakeRecord.price.toLocaleString()}` : null} />
          </div>

          {sakeRecord.notes && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-1">メモ・感想</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{sakeRecord.notes}</p>
            </div>
          )}

          {sakenomyFeature && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">🍶 味わいの特徴（Sakenomy より）</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sakenomyFeature}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            記録者: {authorName}　登録日: {sakeRecord.created_at.slice(0, 10)}
          </p>
        </div>
      </div>
    </div>
  )
}
