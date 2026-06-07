'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('sake_records').delete().eq('id', id)
    router.push('/sake')
    router.refresh()
  }

  if (confirming) return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-gray-500">本当に削除しますか？</span>
      <button onClick={handleDelete} disabled={loading}
        className="text-sm px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition">
        {loading ? '削除中...' : '削除'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
        キャンセル
      </button>
    </div>
  )

  return (
    <button onClick={() => setConfirming(true)}
      className="text-sm px-3 py-1.5 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition">
      削除
    </button>
  )
}
