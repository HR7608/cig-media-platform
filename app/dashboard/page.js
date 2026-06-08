'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {profile?.full_name || user.email}!</h2>
          <p className="text-gray-400">Username: @{profile?.username}</p>
          <p className="text-gray-400">Role: {profile?.role}</p>
          <p className="text-gray-400">Email: {user.email}</p>
        </div>
      </div>
    </main>
  )
}