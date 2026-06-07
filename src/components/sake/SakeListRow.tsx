import Link from 'next/link'
import type { SakeRecord } from '@/types/database'

const RATING_STARS = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)

export default function SakeListRow({ sake }: { sake: SakeRecord }) {
  return (
    <Link href={`/sake/${sake.id}`} className="flex items-center gap-4 bg-white rounded-xl shadow hover:shadow-md transition px-4 py-3">
      {sake.photo_url ? (
        <img src={sake.photo_url} alt={sake.name} className="w-12 h-12 object-contain rounded-lg flex-shrink-0 bg-gray-50" />
      ) : (
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🍶</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-amber-900 truncate">{sake.name}</p>
        <p className="text-sm text-gray-500 truncate">{sake.brewery}{sake.region ? ` / ${sake.region}` : ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-amber-500 text-sm">{RATING_STARS(sake.rating)}</p>
        <p className="text-xs text-gray-400">{sake.drunk_at}</p>
      </div>
    </Link>
  )
}
