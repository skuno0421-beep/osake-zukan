import BackupClient from '@/components/backup/BackupClient'

export default function BackupPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-amber-900">💾 データのバックアップ</h1>
      <BackupClient />
    </div>
  )
}
