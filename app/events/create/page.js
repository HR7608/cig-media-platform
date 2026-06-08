'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateEvent() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    event_date: '',
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
    if (!form.name) return setError('Event name is required')
    setLoading(true)
    setError('')

    const { error } = await supabase.from('events').insert({
      ...form,
      created_by: user.id
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/events')
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Event</h1>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Event Name *"
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
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            <option value="photoshoot">Photoshoot</option>
            <option value="workshop">Workshop</option>
            <option value="trip">Trip</option>
            <option value="competition">Competition</option>
            <option value="cultural fest">Cultural Fest</option>
            <option value="party">Party</option>
            <option value="other">Other</option>
          </select>
          <input
            type="date"
            value={form.event_date}
            onChange={e => setForm({ ...form, event_date: e.target.value })}
            className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-gray-300">Make this event public</span>
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
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}