'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      full_name: fullName,
      role: 'viewer'
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-6 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </main>
  )
}