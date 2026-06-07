import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalysisCharts from '@/components/analysis/AnalysisCharts'
import type { SakeRecord } from '@/types/database'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('sake_records')
    .select('*')
    .order('drunk_at', { ascending: false })

  const records = (data ?? []) as SakeRecord[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-900">📊 好みの分析</h1>
      <AnalysisCharts records={records} />
    </div>
  )
}
