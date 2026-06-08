'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [notifications, setNotifications] = useState([])
  const [favourites, setFavourites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      await fetchProfile(user)
      await fetchRecentEvents()
      await fetchNotifications(user)
      await fetchFavourites(user)
      setLoading(false)
    }
    init()
  }, [])

  const fetchProfile = async (user) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  }

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(3)
    setRecentEvents(data || [])
  }

  const fetchNotifications = async (user) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setNotifications(data || [])
  }

  const fetchFavourites = async (user) => {
    const { data } = await supabase
      .from('favourites')
      .select('*, media(url, thumbnail_url)')
      .eq('user_id', user.id)
      .limit(4)
    setFavourites(data || [])
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}!</h1>
            <p className="text-gray-400 mt-1">@{profile?.username} · {profile?.role}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/events" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
              Browse Events
            </Link>
            <Link href="/search" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
              🔍 Search
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{recentEvents.length}</p>
                <p className="text-gray-400 text-sm mt-1">Recent Events</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{favourites.length}</p>
                <p className="text-gray-400 text-sm mt-1">Favourites</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {notifications.filter(n => !n.is_read).length}
                </p>
                <p className="text-gray-400 text-sm mt-1">Unread</p>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Events</h2>
                <Link href="/events" className="text-blue-400 text-sm hover:underline">View all</Link>
              </div>
              {recentEvents.length === 0 ? (
                <p className="text-gray-500">No events yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentEvents.map(event => (
                    <Link href={`/events/${event.id}`} key={event.id}>
                      <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition">
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-gray-400 text-sm">{event.category || 'No category'}</p>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Favourites */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Favourites</h2>
                <Link href="/favourites" className="text-blue-400 text-sm hover:underline">View all</Link>
              </div>
              {favourites.length === 0 ? (
                <p className="text-gray-500">No favourites yet</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {favourites.map(fav => (
                    <Link href={`/media/${fav.media_id}`} key={fav.id}>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 hover:ring-2 hover:ring-blue-500 transition">
                        <img
                          src={fav.media?.thumbnail_url || fav.media?.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right column - Notifications */}
          <div className="bg-gray-900 rounded-xl p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={markAllRead}
                  className="text-blue-400 text-xs hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg text-sm ${
                      n.is_read ? 'bg-gray-800 text-gray-400' : 'bg-blue-900/40 text-white'
                    }`}
                  >
                    <p>{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}