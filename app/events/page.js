'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Events() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await fetchEvents()
    }
    init()
  }, [sortBy])

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(username, full_name)')
      .eq('is_public', true)
      .order(sortBy, { ascending: sortBy === 'name' })

    if (!error) setEvents(data)
    setLoading(false)
  }

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-gray-400 mt-1">Browse all club events</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
              Dashboard
            </Link>
            {user && (
              <Link href="/events/create" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                + Create Event
              </Link>
            )}
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="event_date">Sort by Event Date</option>
          </select>
        </div>

        {/* Events Grid */}
        {loading ? (
          <p className="text-gray-400">Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No events found</p>
            {user && (
              <Link href="/events/create" className="text-blue-400 hover:underline mt-2 inline-block">
                Create the first event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(event => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition cursor-pointer">
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-600 text-4xl">📷</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{event.name}</h3>
                      {event.category && (
                        <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">{event.category}</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>By {event.profiles?.full_name || 'Unknown'}</span>
                      <span>{event.event_date || new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}