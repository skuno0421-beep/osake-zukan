'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SakeRecord, SakeInsert } from '@/types/database'

// エクスポートに含めるフィールド（IDやuser_idは除く）
const EXPORT_FIELDS: (keyof SakeRecord)[] = [
  'name', 'brewery', 'drunk_at', 'rating',
  'type', 'seimaibuai', 'rice', 'alcohol', 'acidity',
  'sake_meter', 'region', 'location', 'price', 'notes',
  'photo_url', 'sakenomy_id', 'created_at',
]

type ImportResult = {
  success: number
  skipped: number
  errors: string[]
}

export default function BackupClient() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ count: number; oldest: string; newest: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ─── エクスポート ───────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sake_records')
        .select('*')
        .order('drunk_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      const records = (data ?? []) as SakeRecord[]
      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        count: records.length,
        records: records.map(r =>
          Object.fromEntries(EXPORT_FIELDS.map(f => [f, r[f] ?? null]))
        ),
      }

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `osake-zukan-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(`エクスポート失敗: ${e instanceof Error ? e.message : '不明なエラー'}`)
    }
    setExporting(false)
  }

  // ─── ファイル選択時にプレビュー ──────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportResult(null)
    setImportError(null)
    setPreview(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        if (!json.records || !Array.isArray(json.records)) throw new Error('records フィールドが見つかりません')
        const dates = json.records.map((r: Record<string, unknown>) => r.drunk_at as string).filter(Boolean).sort()
        setPreview({
          count: json.records.length,
          oldest: dates[0] ?? '-',
          newest: dates[dates.length - 1] ?? '-',
        })
      } catch (err) {
        setImportError(`ファイルの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
      }
    }
    reader.readAsText(file)
  }

  // ─── インポート ─────────────────────────────────────────
  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file || !preview) return

    setImporting(true)
    setImportResult(null)
    setImportError(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const records: Record<string, unknown>[] = json.records

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      // 既存レコードのname+drunk_atの組み合わせを取得して重複チェック
      const { data: existing } = await supabase
        .from('sake_records')
        .select('name, drunk_at')
      const existingSet = new Set(
        (existing ?? []).map((r: { name: string; drunk_at: string }) => `${r.name}__${r.drunk_at}`)
      )

      const result: ImportResult = { success: 0, skipped: 0, errors: [] }
      const BATCH = 50

      const toInsert: SakeInsert[] = []
      for (const r of records) {
        const key = `${r.name}__${r.drunk_at}`
        if (existingSet.has(key)) {
          result.skipped++
          continue
        }
        toInsert.push({
          user_id: user.id,
          name: String(r.name ?? ''),
          brewery: String(r.brewery ?? ''),
          drunk_at: String(r.drunk_at ?? new Date().toISOString().slice(0, 10)),
          rating: Number(r.rating ?? 3),
          type: r.type ? String(r.type) : null,
          seimaibuai: r.seimaibuai != null ? Number(r.seimaibuai) : null,
          rice: r.rice ? String(r.rice) : null,
          alcohol: r.alcohol != null ? Number(r.alcohol) : null,
          acidity: r.acidity != null ? Number(r.acidity) : null,
          sake_meter: r.sake_meter != null ? Number(r.sake_meter) : null,
          region: r.region ? String(r.region) : null,
          location: r.location ? String(r.location) : null,
          price: r.price != null ? Number(r.price) : null,
          notes: r.notes ? String(r.notes) : null,
          photo_url: r.photo_url ? String(r.photo_url) : null,
          sakenomy_id: r.sakenomy_id ? String(r.sakenomy_id) : null,
        })
      }

      // バッチで挿入
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH)
        const { error } = await supabase.from('sake_records').insert(batch)
        if (error) {
          result.errors.push(`バッチ ${Math.floor(i / BATCH) + 1}: ${error.message}`)
        } else {
          result.success += batch.length
        }
      }

      setImportResult(result)
      if (fileRef.current) fileRef.current.value = ''
      setPreview(null)
    } catch (e) {
      setImportError(`インポート失敗: ${e instanceof Error ? e.message : '不明なエラー'}`)
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6">

      {/* エクスポート */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">📤 エクスポート</h2>
        <p className="text-sm text-gray-500 mb-4">
          登録されているすべてのお酒データをJSONファイルとしてダウンロードします。
          定期的にバックアップしておくことをおすすめします。
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition"
        >
          {exporting ? 'エクスポート中...' : 'JSONでダウンロード'}
        </button>
      </div>

      {/* インポート */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">📥 インポート</h2>
        <p className="text-sm text-gray-500 mb-4">
          エクスポートしたJSONファイルからデータを復元します。
          同じ銘柄・飲んだ日付のレコードは重複をスキップします。
        </p>

        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
          />

          {/* プレビュー */}
          {preview && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-2">📋 ファイル内容の確認</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-2xl font-bold text-amber-600">{preview.count}</p>
                  <p className="text-xs text-gray-500">件のデータ</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-sm font-bold text-amber-600">{preview.oldest}</p>
                  <p className="text-xs text-gray-500">最古の記録</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-sm font-bold text-amber-600">{preview.newest}</p>
                  <p className="text-xs text-gray-500">最新の記録</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ※ 既に登録されている同じ銘柄・日付のデータはスキップされます
              </p>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {importError}
            </div>
          )}

          {importResult && (
            <div className={`rounded-lg p-4 text-sm border ${importResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <p className="font-semibold mb-2">
                {importResult.errors.length === 0 ? '✅ インポート完了' : '⚠️ インポート完了（一部エラー）'}
              </p>
              <ul className="space-y-1 text-gray-700">
                <li>✔ 追加: <strong>{importResult.success}件</strong></li>
                <li>⏭ スキップ（重複）: <strong>{importResult.skipped}件</strong></li>
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-red-600">✗ {e}</li>
                ))}
              </ul>
            </div>
          )}

          {preview && !importResult && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition"
            >
              {importing ? `インポート中...` : `${preview.count}件をインポートする`}
            </button>
          )}
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">⚠️ ご注意</p>
        <p>・写真はSupabaseまたはSakenomyのURLとして保存されており、インポート後もそのまま参照されます。</p>
        <p>・インポートは上書きではなく追記です。既存データは削除されません。</p>
        <p>・重複チェックは「銘柄名＋飲んだ日付」の組み合わせで行います。</p>
      </div>

    </div>
  )
}
