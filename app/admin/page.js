'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/useProfile'

export default function AdminPanel() {
  const router = useRouter()
  const { profile, isAdmin, loading } = useProfile()
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/dashboard')
    if (!loading && isAdmin) fetchUsers()
  }, [loading, isAdmin])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  const updateRole = async (userId, newRole) => {
    setSaving(userId)
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setSaving(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <p className="font-semibold">Manage User Roles ({users.length} users)</p>
          </div>
          <div className="divide-y divide-gray-800">
            {users.map(user => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-gray-400 text-sm">@{user.username}</p>
                </div>
                <select
                  value={user.role}
                  onChange={e => updateRole(user.id, e.target.value)}
                  disabled={saving === user.id || user.id === profile?.id}
                  className="bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="photographer">Photographer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}