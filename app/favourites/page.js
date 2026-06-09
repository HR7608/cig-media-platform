'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Favourites() {
  const router = useRouter()
  const [favourites, setFavourites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase
        .from('favourites')
        .select('*, media(id, url, thumbnail_url, tags, created_at, profiles(full_name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setFavourites(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">My Favourites</h1>
          <span className="text-gray-400">({favourites.length})</span>
        </div>

        {favourites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">★</p>
            <p className="text-gray-400 text-lg">No favourites yet</p>
            <Link href="/events" className="text-blue-400 hover:underline mt-2 inline-block">
              Browse events to find photos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favourites.map(fav => (
              <Link href={`/media/${fav.media_id}`} key={fav.id}>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-yellow-500 transition cursor-pointer group relative">
                  <img
                    src={fav.media?.thumbnail_url || fav.media?.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {fav.media?.tags && fav.media.tags.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                      <div className="flex flex-wrap gap-1">
                        {fav.media.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-yellow-600/80 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}