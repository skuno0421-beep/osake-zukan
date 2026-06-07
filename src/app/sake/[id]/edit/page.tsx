import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SakeForm from '@/components/sake/SakeForm'

export default async function EditSakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: sake } = await supabase.from('sake_records').select('*').eq('id', id).single()
  if (!sake) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id !== sake.user_id) redirect(`/sake/${id}`)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-amber-900 mb-4">日本酒を編集</h1>
      <SakeForm initial={sake} />
    </div>
  )
}
