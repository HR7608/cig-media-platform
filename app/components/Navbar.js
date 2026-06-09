'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useProfile } from '@/lib/useProfile'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { profile, isAdmin } = useProfile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
      setNotifications(notifs || [])

      // Realtime notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev])
        })
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
    setNotifications([])
    setShowNotifications(false)
  }

  if (['/', '/login', '/signup'].includes(pathname)) return null
  if (!user) return null

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">

        {/* Logo */}
        <Link href="/dashboard" className="font-bold text-xl text-white">
          CIG Media
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm transition ${
              pathname === '/dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/events"
            className={`px-3 py-2 rounded-lg text-sm transition ${
              pathname.startsWith('/events') ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Events
          </Link>
          <Link
            href="/search"
            className={`px-3 py-2 rounded-lg text-sm transition ${
              pathname === '/search' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Search
          </Link>
          <Link
            href="/favourites"
            className={`px-3 py-2 rounded-lg text-sm transition ${
              pathname === '/favourites' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Favourites
          </Link>
          <Link
            href="/face-search"
            className={`px-3 py-2 rounded-lg text-sm transition ${
              pathname === '/face-search' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Find Me
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm transition ${
                pathname === '/admin' ? 'bg-gray-700 text-white' : 'text-red-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              🔔
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <p className="font-semibold">Notifications</p>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-blue-400 text-xs hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 text-sm p-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-gray-700 hover:bg-gray-700 transition">
                        <p className="text-sm text-white">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.[0] || '?'}
            </div>
            <span className="text-sm text-gray-300">{profile?.username}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}