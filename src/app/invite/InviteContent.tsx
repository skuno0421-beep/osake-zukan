'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'verify' | 'register' | 'invalid'>('verify')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    const supabase = createClient()
    supabase
      .from('invitations')
      .select('id, expires_at, used_by')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStep('invalid'); return }
        const inv = data as { expires_at: string; used_by: string | null }
        if (inv.used_by || new Date(inv.expires_at) < new Date()) {
          setStep('invalid')
        } else {
          setStep('register')
        }
      })
  }, [token])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('invitations').update({ used_by: user.id }).eq('token', token)
    }

    router.push('/sake')
  }

  if (step === 'verify') return <div className="min-h-screen flex items-center justify-center">招待リンクを確認中...</div>
  if (step === 'invalid') return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="bg-white rounded-2xl shadow p-8 text-center">
        <p className="text-red-500 font-medium">この招待リンクは無効または期限切れです。</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-amber-900 mb-6">🍶 アカウント作成</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg disabled:opacity-50 transition">
            {loading ? '作成中...' : 'アカウントを作成'}
          </button>
        </form>
      </div>
    </div>
  )
}
