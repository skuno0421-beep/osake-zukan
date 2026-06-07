import SakeForm from '@/components/sake/SakeForm'

export default function NewSakePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-amber-900 mb-4">日本酒を追加</h1>
      <SakeForm />
    </div>
  )
}
