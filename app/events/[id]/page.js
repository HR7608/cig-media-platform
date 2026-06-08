'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'

export default function EventPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [albums, setAlbums] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await fetchEvent()
      await fetchAlbums()
    }
    init()
  }, [])

  const fetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, profiles(username, full_name)')
      .eq('id', id)
      .single()
    setEvent(data)
  }

  const fetchAlbums = async () => {
    const { data } = await supabase
      .from('albums')
      .select('*, profiles(username, full_name)')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
    setAlbums(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Event not found
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.push('/events')}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
        >
          ← Back to Events
        </button>

        {/* Event Header */}
        <div className="bg-gray-900 rounded-xl overflow-hidden mb-8">
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.name} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
              <span className="text-6xl">📷</span>
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{event.name}</h1>
                  {event.category && (
                    <span className="bg-blue-600 text-sm px-3 py-1 rounded-full">{event.category}</span>
                  )}
                  {!event.is_public && (
                    <span className="bg-yellow-600 text-sm px-3 py-1 rounded-full">Private</span>
                  )}
                </div>
                {event.description && (
                  <p className="text-gray-400 mb-3">{event.description}</p>
                )}
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Organized by {event.profiles?.full_name || 'Unknown'}</span>
                  {event.event_date && <span>📅 {event.event_date}</span>}
                </div>
              </div>
              {user && user.id === event.created_by && (
                <Link
                  href={`/events/${event.id}/edit`}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
                >
                  Edit Event
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Albums Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Albums</h2>
          {user && (
            <Link
              href={`/events/${event.id}/albums/create`}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
            >
              + Create Album
            </Link>
          )}
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-xl">
            <p className="text-gray-400 text-lg">No albums yet</p>
            {user && (
              <Link
                href={`/events/${event.id}/albums/create`}
                className="text-blue-400 hover:underline mt-2 inline-block"
              >
                Create the first album
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map(album => (
              <Link href={`/events/${event.id}/albums/${album.id}`} key={album.id}>
                <div className="bg-gray-900 rounded-xl p-6 hover:ring-2 hover:ring-blue-500 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{album.name}</h3>
                    {!album.is_public && (
                      <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full">Private</span>
                    )}
                  </div>
                  {album.description && (
                    <p className="text-gray-400 text-sm mb-3">{album.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    By {album.profiles?.full_name || 'Unknown'} · {new Date(album.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}