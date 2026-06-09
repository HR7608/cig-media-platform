'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Search() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [results, setResults] = useState({ events: [], media: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const [eventsRes, mediaRes, usersRes] = await Promise.all([
      // Search events by name and category
      supabase
        .from('events')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(10),

      // Search media by tags and caption
      supabase
        .from('media')
        .select('*, profiles(username, full_name)')
        .or(`caption.ilike.%${query}%`)
        .contains('tags', [query.toLowerCase()])
        .eq('is_public', true)
        .limit(10),

      // Search users by username and full name
      supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10)
    ])

    // Also search media by tags separately since .contains doesn't combine well with .or
    const { data: tagMedia } = await supabase
      .from('media')
      .select('*, profiles(username, full_name)')
      .contains('tags', [query.toLowerCase()])
      .eq('is_public', true)
      .limit(10)

    const { data: captionMedia } = await supabase
      .from('media')
      .select('*, profiles(username, full_name)')
      .ilike('caption', `%${query}%`)
      .eq('is_public', true)
      .limit(10)

    // Merge and deduplicate media results
    const allMedia = [...(tagMedia || []), ...(captionMedia || [])]
    const uniqueMedia = allMedia.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    )

    setResults({
      events: eventsRes.data || [],
      media: uniqueMedia,
      users: usersRes.data || []
    })

    setLoading(false)
  }

  const totalResults = results.events.length + results.media.length + results.users.length

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Search</h1>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search events, tags, users..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-gray-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {['all', 'events', 'media', 'users'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === f ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {f}
              {searched && f !== 'all' && (
                <span className="ml-2 text-xs opacity-70">
                  ({f === 'events' ? results.events.length : f === 'media' ? results.media.length : results.users.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {searched && !loading && (
          <div>
            {totalResults === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No results for "{query}"</p>
                <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">

                {/* Events */}
                {(filter === 'all' || filter === 'events') && results.events.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-gray-300">
                      Events ({results.events.length})
                    </h2>
                    <div className="flex flex-col gap-3">
                      {results.events.map(event => (
                        <Link href={`/events/${event.id}`} key={event.id}>
                          <div className="bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition flex justify-between items-center">
                            <div>
                              <p className="font-medium">{event.name}</p>
                              {event.description && (
                                <p className="text-gray-400 text-sm mt-1 line-clamp-1">{event.description}</p>
                              )}
                            </div>
                            {event.category && (
                              <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">{event.category}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media */}
                {(filter === 'all' || filter === 'media') && results.media.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-gray-300">
                      Photos ({results.media.length})
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {results.media.map(item => (
                        <Link href={`/media/${item.id}`} key={item.id}>
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-blue-500 transition">
                            <img
                              src={item.thumbnail_url || item.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {(filter === 'all' || filter === 'users') && results.users.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-gray-300">
                      Users ({results.users.length})
                    </h2>
                    <div className="flex flex-col gap-3">
                      {results.users.map(u => (
                        <div key={u.id} className="bg-gray-900 rounded-xl p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                            {u.full_name?.[0] || u.username?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            <p className="text-gray-400 text-sm">@{u.username} · {u.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400">Search for events, photos by tags, or users</p>
          </div>
        )}

      </div>
    </main>
  )
}