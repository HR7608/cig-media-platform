'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateAlbum({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_public: true
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      setUser(user)
    }
    getUser()
  }, [])

  const handleCreate = async () => {
    if (!form.name) return setError('Album name is required')
    setLoading(true)
    setError('')

    const { error } = await supabase.from('albums').insert({
      ...form,
      event_id: id,
      created_by: user.id
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/events/${id}`)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-8">Create Album</h1>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Album Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-gray-300">Make this album public</span>
          </label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}