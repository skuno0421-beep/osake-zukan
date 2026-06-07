'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as topojson from 'topojson-client'
import * as d3 from 'd3-geo'
import { getPrefectureColor } from '@/lib/mapColor'

type Props = {
  countMap: Record<string, number>
  topSakeMap: Record<string, { name: string; rating: number }>
}

type Tooltip = { x: number; y: number; prefecture: string; count: number; topSake?: string } | null

export default function JapanMap({ countMap, topSakeMap }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip>(null)
  const [paths, setPaths] = useState<{ d: string; name: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/japan.topojson')
      .then(r => r.json())
      .then(topo => {
        const W = 800, H = 680
        const geojson = topojson.feature(topo, topo.objects.japan) as unknown as GeoJSON.FeatureCollection
        const projection = d3.geoMercator().fitSize([W, H], geojson)
        const pathGen = d3.geoPath().projection(projection)
        const result = geojson.features.map(f => ({
          d: pathGen(f) ?? '',
          name: (f.properties as { nam_ja?: string }).nam_ja ?? '',
        }))
        setPaths(result)
      })
  }, [])

  return (
    <div className="relative w-full overflow-x-auto">
      <svg ref={svgRef} viewBox="0 0 800 680" className="w-full max-w-3xl mx-auto block">
        {paths.map(({ d, name }) => {
          const count = countMap[name] ?? 0
          return (
            <path
              key={name}
              d={d}
              fill={getPrefectureColor(count)}
              stroke="#999"
              strokeWidth={0.5}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={e => {
                const rect = svgRef.current?.getBoundingClientRect()
                setTooltip({
                  x: e.clientX - (rect?.left ?? 0),
                  y: e.clientY - (rect?.top ?? 0),
                  prefecture: name,
                  count,
                  topSake: topSakeMap[name]?.name,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => router.push(`/sake?region=${encodeURIComponent(name)}`)}
            />
          )
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <p className="font-bold text-amber-900">{tooltip.prefecture}</p>
          <p className="text-gray-600">{tooltip.count}本記録済み</p>
          {tooltip.topSake && <p className="text-gray-400 text-xs mt-0.5">代表: {tooltip.topSake}</p>}
        </div>
      )}
    </div>
  )
}
