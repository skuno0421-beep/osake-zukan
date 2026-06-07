'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Cell,
} from 'recharts'
import type { SakeRecord } from '@/types/database'

type Props = { records: SakeRecord[] }

// 平均を小数第1位で返す
function avg(arr: number[]) {
  if (!arr.length) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10
}

// カテゴリ別平均評価を計算
function categoryAvg(records: SakeRecord[], key: keyof SakeRecord) {
  const map: Record<string, number[]> = {}
  for (const r of records) {
    const v = r[key]
    if (!v) continue
    const k = String(v)
    if (!map[k]) map[k] = []
    map[k].push(r.rating)
  }
  return Object.entries(map)
    .map(([name, ratings]) => ({ name, avg: avg(ratings), count: ratings.length }))
    .filter(d => d.count >= 1)
    .sort((a, b) => b.avg - a.avg)
}

// 散布図用データ
function scatterData(records: SakeRecord[], key: keyof SakeRecord) {
  return records
    .filter(r => r[key] != null)
    .map(r => ({ x: Number(r[key]), y: r.rating, name: r.name }))
}

// 総括テキストを生成
function generateSummary(records: SakeRecord[]) {
  if (records.length < 3) return null

  const insights: string[] = []

  // 好みの種類
  const typeData = categoryAvg(records, 'type').filter(d => d.count >= 2)
  if (typeData.length > 0) {
    insights.push(`**${typeData[0].name}**が最も高評価（平均 ${typeData[0].avg}点）`)
  }

  // 好みの産地
  const regionData = categoryAvg(records, 'region').filter(d => d.count >= 2)
  if (regionData.length > 0) {
    insights.push(`産地では**${regionData[0].name}**のお酒が好み（平均 ${regionData[0].avg}点）`)
  }

  // 精米歩合の傾向
  const seimaiRecords = records.filter(r => r.seimaibuai != null)
  if (seimaiRecords.length >= 3) {
    const highRate = seimaiRecords.filter(r => r.seimaibuai! <= 50 && r.rating >= 4).length
    const lowRate = seimaiRecords.filter(r => r.seimaibuai! > 60 && r.rating >= 4).length
    if (highRate > lowRate) insights.push('精米歩合が**低い（磨かれた）**お酒を好む傾向')
    else if (lowRate > highRate) insights.push('精米歩合が**高い（素朴な味わい）**お酒を好む傾向')
  }

  // アルコール度数の傾向
  const alcRecords = records.filter(r => r.alcohol != null)
  if (alcRecords.length >= 3) {
    const avgAlc = avg(alcRecords.map(r => Number(r.alcohol)))
    const hiRating = alcRecords.filter(r => Number(r.alcohol) >= avgAlc && r.rating >= 4).length
    const loRating = alcRecords.filter(r => Number(r.alcohol) < avgAlc && r.rating >= 4).length
    if (hiRating > loRating + 1) insights.push('アルコール度数が**高め**のお酒を好む傾向')
    else if (loRating > hiRating + 1) insights.push('アルコール度数が**低め**のお酒を好む傾向')
  }

  // 日本酒度の傾向
  const smRecords = records.filter(r => r.sake_meter != null)
  if (smRecords.length >= 3) {
    const dryHigh = smRecords.filter(r => Number(r.sake_meter) > 0 && r.rating >= 4).length
    const sweetHigh = smRecords.filter(r => Number(r.sake_meter) <= 0 && r.rating >= 4).length
    if (dryHigh > sweetHigh + 1) insights.push('**辛口**（日本酒度プラス）を好む傾向')
    else if (sweetHigh > dryHigh + 1) insights.push('**甘口**（日本酒度マイナス）を好む傾向')
  }

  // 総評価
  const totalAvg = avg(records.map(r => r.rating))
  const highCount = records.filter(r => r.rating >= 4).length

  return {
    total: records.length,
    avgRating: totalAvg,
    highCount,
    insights,
  }
}

const AMBER = '#d97706'
const AMBER_LIGHT = '#fbbf24'

export default function AnalysisCharts({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-4">🍶</p>
        <p>まだ記録がありません。お酒を登録すると分析が表示されます。</p>
      </div>
    )
  }

  const summary = generateSummary(records)
  const typeData = categoryAvg(records, 'type').slice(0, 8)
  const regionData = categoryAvg(records, 'region').slice(0, 10)
  const seimaiData = scatterData(records, 'seimaibuai')
  const alcoholData = scatterData(records, 'alcohol')
  const sakeMeterData = scatterData(records, 'sake_meter')
  const acidityData = scatterData(records, 'acidity')

  return (
    <div className="space-y-6">

      {/* 好みの総括 */}
      {summary && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-amber-900 mb-3">🎯 好みの総括</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-600">{summary.total}</p>
              <p className="text-xs text-gray-500 mt-1">記録数</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-600">{summary.avgRating}</p>
              <p className="text-xs text-gray-500 mt-1">平均評価</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-600">{summary.highCount}</p>
              <p className="text-xs text-gray-500 mt-1">高評価（★4以上）</p>
            </div>
          </div>
          {summary.insights.length > 0 && (
            <ul className="space-y-2">
              {summary.insights.map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-500 mt-0.5">◆</span>
                  <span dangerouslySetInnerHTML={{
                    __html: text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-800">$1</strong>')
                  }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 種類別 */}
      {typeData.length > 0 && (
        <ChartCard title="種類別 平均評価">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
              <Tooltip formatter={(v) => [`${v}点`, '平均評価']} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? AMBER : AMBER_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 産地別 */}
      {regionData.length > 0 && (
        <ChartCard title="産地別 平均評価（上位10件）">
          <ResponsiveContainer width="100%" height={Math.max(200, regionData.length * 32)}>
            <BarChart data={regionData} layout="vertical" margin={{ left: 70, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={65} />
              <Tooltip formatter={(v) => [`${v}点`, '平均評価']} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {regionData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? AMBER : AMBER_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 散布図グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {seimaiData.length >= 2 && (
          <ChartCard title="精米歩合 vs 評価" note="低いほど磨かれた酒">
            <ScatterPlot data={seimaiData} xLabel="精米歩合 (%)" xDomain={[0, 100]} />
          </ChartCard>
        )}
        {alcoholData.length >= 2 && (
          <ChartCard title="アルコール度数 vs 評価">
            <ScatterPlot data={alcoholData} xLabel="アルコール度数 (%)" />
          </ChartCard>
        )}
        {sakeMeterData.length >= 2 && (
          <ChartCard title="日本酒度 vs 評価" note="＋辛口 / −甘口">
            <ScatterPlot data={sakeMeterData} xLabel="日本酒度" showZeroLine />
          </ChartCard>
        )}
        {acidityData.length >= 2 && (
          <ChartCard title="酸度 vs 評価">
            <ScatterPlot data={acidityData} xLabel="酸度" />
          </ChartCard>
        )}
      </div>

    </div>
  )
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="font-bold text-gray-800">{title}</h3>
        {note && <span className="text-xs text-gray-400">{note}</span>}
      </div>
      {children}
    </div>
  )
}

type ScatterProps = {
  data: { x: number; y: number; name: string }[]
  xLabel: string
  xDomain?: [number, number]
  showZeroLine?: boolean
}

function ScatterPlot({ data, xLabel, xDomain, showZeroLine }: ScatterProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number" dataKey="x" name={xLabel}
          domain={xDomain ?? ['auto', 'auto']}
          tick={{ fontSize: 11 }}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: '#6b7280' }}
        />
        <YAxis
          type="number" dataKey="y" name="評価"
          domain={[0.5, 5.5]} ticks={[1,2,3,4,5]}
          tick={{ fontSize: 11 }}
          label={{ value: '評価', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
                <p className="font-medium text-gray-800 mb-1">{d.name}</p>
                <p className="text-gray-600">{xLabel}: {d.x}</p>
                <p className="text-amber-600">評価: {'★'.repeat(d.y)}{'☆'.repeat(5 - d.y)}</p>
              </div>
            )
          }}
        />
        {showZeroLine && <ReferenceLine x={0} stroke="#d1d5db" strokeDasharray="4 2" label={{ value: '±0', fontSize: 10, fill: '#9ca3af' }} />}
        <Scatter data={data} fill={AMBER} fillOpacity={0.75} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
