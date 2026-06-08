'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { SakeRecord } from '@/types/database'
import SakeListRow from '@/components/sake/SakeListRow'

const SAKE_TYPES = ['大吟醸', '吟醸', '純米大吟醸', '純米吟醸', '純米', '本醸造', '普通酒']
const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

export default function SakePage() {
  const [records, setRecords] = useState<SakeRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [sortBy, setSortBy] = useState<'drunk_at' | 'rating' | 'created_at'>('drunk_at')

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // 飲んだ日付順の場合は同日内をcreated_at降順（最新登録が上）で第2ソート
    let q = supabase.from('sake_records').select('*')
    if (sortBy === 'drunk_at') {
      q = q.order('drunk_at', { ascending: false }).order('created_at', { ascending: false })
    } else {
      q = q.order(sortBy, { ascending: false }).order('created_at', { ascending: false })
    }
    if (query) q = q.or(`name.ilike.%${query}%,brewery.ilike.%${query}%`)
    if (filterType) q = q.eq('type', filterType)
    if (filterRegion) q = q.eq('region', filterRegion)
    if (filterRating) q = q.eq('rating', Number(filterRating))
    const { data } = await q
    setRecords(data ?? [])
    setLoading(false)
  }, [query, filterType, filterRegion, filterRating, sortBy])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-amber-900">日本酒一覧</h1>
        <Link href="/sake/new" className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + 追加
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="銘柄名・蔵元で検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex flex-wrap gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">種類: すべて</option>
            {SAKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">産地: すべて</option>
            {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">評価: すべて</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="drunk_at">飲んだ日付順</option>
            <option value="rating">評価順</option>
            <option value="created_at">登録順</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🍶</p>
          <p>まだ記録がありません。最初の一本を追加しましょう！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(s => <SakeListRow key={s.id} sake={s} />)}
        </div>
      )}
    </div>
  )
}
