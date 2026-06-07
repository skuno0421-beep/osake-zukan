import { Suspense } from 'react'
import InviteContent from './InviteContent'

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <InviteContent />
    </Suspense>
  )
}
