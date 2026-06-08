'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SakeRecord, SakeInsert, SakeUpdate } from '@/types/database'
import type { SakenomyResult, SakenomyDetail } from '@/lib/sakenomy'

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

type Props = { initial?: SakeRecord }

export default function SakeForm({ initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? '')
  const [brewery, setBrewery] = useState(initial?.brewery ?? '')
  const [drunkAt, setDrunkAt] = useState(initial?.drunk_at ?? new Date().toISOString().slice(0, 10))
  const [rating, setRating] = useState(initial?.rating ?? 3)
  const [type, setType] = useState(initial?.type ?? '')
  const [seimaibuai, setSeimaibuai] = useState(initial?.seimaibuai?.toString() ?? '')
  const [rice, setRice] = useState(initial?.rice ?? '')
  const [alcohol, setAlcohol] = useState(initial?.alcohol?.toString() ?? '')
  const [acidity, setAcidity] = useState(initial?.acidity?.toString() ?? '')
  const [sakeMeter, setSakeMeter] = useState(initial?.sake_meter?.toString() ?? '')
  const [region, setRegion] = useState(initial?.region ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [sakenomyId, setSakenomyId] = useState(initial?.sakenomy_id ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photo_url ?? null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null) // Sakenomy画像URL or アップロードURL

  // Sakenomy 検索
  const [suggestions, setSuggestions] = useState<SakenomyResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [sakenomyFeature, setSakenomyFeature] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (name.length < 2) { setSuggestions([]); return }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/sakenomy?q=${encodeURIComponent(name)}`)
      const data: SakenomyResult[] = res.ok ? await res.json() : []
      setSuggestions(data)
      setSearching(false)
    }, 500)
  }, [name])

  async function applySuggestion(s: SakenomyResult) {
    setName(s.name)
    setBrewery(s.brewery)
    if (s.region) setRegion(s.region)
    if (s.type) setType(s.type)
    setSakenomyId(s.id)
    setSuggestions([])
    setSakenomyFeature(null)

    // 詳細情報を取得して自動補完
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/sakenomy/detail?id=${encodeURIComponent(s.id)}`)
      if (res.ok) {
        const detail: SakenomyDetail = await res.json()
        if (detail.feature) setSakenomyFeature(detail.feature)
        if (detail.type) setType(detail.type)
        if (detail.alcohol) setAlcohol(detail.alcohol)
        if (detail.acidity) setAcidity(detail.acidity)
        if (detail.sakeMeterValue) setSakeMeter(detail.sakeMeterValue.replace('+', ''))
        if (detail.ricePolishingRatio) setSeimaibuai(detail.ricePolishingRatio)
        if (detail.rices.length > 0) setRice(detail.rices.join('、'))
        if (detail.imageUrl) {
          setPhotoUrl(detail.imageUrl)
          setPhotoPreview(detail.imageUrl)
          setPhotoFile(null) // ローカルファイル選択をクリア
        }
      }
    } catch { /* ignore */ }
    setLoadingDetail(false)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoUrl(null) // ローカルファイルを選んだらSakenomy画像URLをクリア
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('ログインが必要です'); setLoading(false); return }

    let photo_url = photoUrl ?? initial?.photo_url ?? null
    if (photoFile) {
      // ローカルファイルが選択されていればアップロードしてURLを上書き
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('sake-photos').upload(path, photoFile)
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('sake-photos').getPublicUrl(path)
      photo_url = publicUrl
    }

    const payload = {
      name, brewery,
      drunk_at: drunkAt,
      rating,
      type: type || null,
      seimaibuai: seimaibuai ? Number(seimaibuai) : null,
      rice: rice || null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: acidity ? Number(acidity) : null,
      sake_meter: sakeMeter ? Number(sakeMeter) : null,
      region: region || null,
      location: location || null,
      price: price ? Number(price) : null,
      notes: notes || null,
      photo_url,
      sakenomy_id: sakenomyId || null,
    }

    if (isEdit) {
      const { error } = await supabase.from('sake_records').update(payload as SakeUpdate).eq('id', initial.id)
      if (error) { setError(error.message); setLoading(false); return }
      router.push(`/sake/${initial.id}`)
    } else {
      const { data, error } = await supabase.from('sake_records').insert({ ...payload, user_id: user.id } as SakeInsert).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      router.push(`/sake/${data.id}`)
    }
    router.refresh()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
      {/* 銘柄名 + Sakenomy 候補 */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">銘柄名 <span className="text-red-500">*</span></label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="例: 獺祭" />
        {searching && <p className="text-xs text-gray-400 mt-1">Sakenomy を検索中...</p>}
        {loadingDetail && <p className="text-xs text-amber-500 mt-1">✨ 詳細情報を取得中...</p>}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-72 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => applySuggestion(s)}
                className="px-3 py-2 text-sm hover:bg-amber-50 cursor-pointer border-b border-gray-50 last:border-0">
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-400 ml-2">{s.brewery}{s.region ? ` / ${s.region}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sakenomy 味わいの特徴 */}
      {sakenomyFeature && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">🍶 味わいの特徴（Sakenomy より）</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sakenomyFeature}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">蔵元・メーカー <span className="text-red-500">*</span></label>
        <input type="text" value={brewery} onChange={e => setBrewery(e.target.value)} required className={inputCls} placeholder="例: 旭酒造" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">飲んだ日付 <span className="text-red-500">*</span></label>
          <input type="date" value={drunkAt} onChange={e => setDrunkAt(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">評価 <span className="text-red-500">*</span></label>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5].map(r => (
              <button key={r} type="button" onClick={() => setRating(r)}
                className={`text-2xl transition ${r <= rating ? 'text-amber-500' : 'text-gray-300'}`}>★</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="">未選択</option>
            {SAKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">産地・都道府県</label>
          <select value={region} onChange={e => setRegion(e.target.value)} className={inputCls}>
            <option value="">未選択</option>
            {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">精米歩合 (%)</label>
          <input type="number" value={seimaibuai} onChange={e => setSeimaibuai(e.target.value)} className={inputCls} min={0} max={100} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">アルコール度数 (%)</label>
          <input type="number" value={alcohol} onChange={e => setAlcohol(e.target.value)} className={inputCls} step="0.1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日本酒度</label>
          <input type="number" value={sakeMeter} onChange={e => setSakeMeter(e.target.value)} className={inputCls} step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">使用米</label>
          <input type="text" value={rice} onChange={e => setRice(e.target.value)} className={inputCls} placeholder="例: 山田錦" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">酸度</label>
          <input type="number" value={acidity} onChange={e => setAcidity(e.target.value)} className={inputCls} step="0.1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">飲んだ場所・店名</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="例: 居酒屋〇〇" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} min={0} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ・感想</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="香り、味わい、合う料理など..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">写真</label>
        {photoPreview && (
          <div className="mb-2 relative inline-block">
            <img src={photoPreview} alt="プレビュー" className="h-40 rounded-lg object-contain border border-gray-200 bg-gray-50" />
            {photoUrl && !photoFile && (
              <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Sakenomy</span>
            )}
            <button type="button" onClick={() => { setPhotoPreview(null); setPhotoUrl(null); setPhotoFile(null) }}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600">
              ✕
            </button>
          </div>
        )}
        {!photoPreview && (
          <div className="mt-1">
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">※ Sakenomy から候補を選ぶと商品画像が自動で設定されます</p>
          </div>
        )}
        {photoPreview && (
          <div className="mt-1">
            <label className="text-xs text-gray-500 cursor-pointer underline">
              別の写真を選ぶ
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg disabled:opacity-50 transition">
          {loading ? '保存中...' : isEdit ? '更新する' : '追加する'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
          キャンセル
        </button>
      </div>
    </form>
  )
}
