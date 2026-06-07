import Link from 'next/link'
import type { SakeRecord } from '@/types/database'

const RATING_STARS = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)

export default function SakeCard({ sake }: { sake: SakeRecord }) {
  return (
    <Link href={`/sake/${sake.id}`} className="block bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden">
      {sake.photo_url ? (
        <img src={sake.photo_url} alt={sake.name} className="w-full h-40 object-contain bg-gray-50 p-2" />
      ) : (
        <div className="w-full h-40 bg-amber-100 flex items-center justify-center text-4xl">🍶</div>
      )}
      <div className="p-3">
        <p className="font-bold text-amber-900 truncate">{sake.name}</p>
        <p className="text-sm text-gray-500 truncate">{sake.brewery}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-amber-500 text-sm">{RATING_STARS(sake.rating)}</span>
          {sake.region && <span className="text-xs text-gray-400">{sake.region}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1">{sake.drunk_at}</p>
      </div>
    </Link>
  )
}
