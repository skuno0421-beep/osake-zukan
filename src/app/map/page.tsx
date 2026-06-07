import { createClient } from '@/lib/supabase/server'
import JapanMap from '@/components/map/JapanMap'
import { getColorLegend } from '@/lib/mapColor'

export default async function MapPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('sake_records').select('region, name, rating')

  const countMap: Record<string, number> = {}
  const topSakeMap: Record<string, { name: string; rating: number }> = {}

  for (const r of data ?? []) {
    if (!r.region) continue
    countMap[r.region] = (countMap[r.region] ?? 0) + 1
    if (!topSakeMap[r.region] || r.rating > topSakeMap[r.region].rating) {
      topSakeMap[r.region] = { name: r.name, rating: r.rating }
    }
  }

  const legend = getColorLegend()

  return (
    <div>
      <h1 className="text-xl font-bold text-amber-900 mb-4">産地マップ</h1>
      <div className="bg-white rounded-xl shadow p-4">
        <JapanMap countMap={countMap} topSakeMap={topSakeMap} />
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {legend.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-4 h-4 rounded inline-block border border-gray-200" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
