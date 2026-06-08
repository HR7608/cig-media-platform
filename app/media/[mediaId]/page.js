'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MediaPage({ params }) {
  const { mediaId } = use(params)
  const router = useRouter()
  const [media, setMedia] = useState(null)
  const [user, setUser] = useState(null)
  const [likes, setLikes] = useState([])
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [favourited, setFavourited] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await fetchMedia()
      await fetchLikes(user)
      await fetchComments()
      await fetchFavourite(user)
    }
    init()
  }, [])

  const fetchMedia = async () => {
    const { data } = await supabase
      .from('media')
      .select('*, profiles(username, full_name)')
      .eq('id', mediaId)
      .single()
    setMedia(data)
    setLoading(false)
  }

  const fetchLikes = async (user) => {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('media_id', mediaId)
    setLikes(data || [])
    if (user) setLiked(data?.some(l => l.user_id === user.id))
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, full_name)')
      .eq('media_id', mediaId)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const fetchFavourite = async (user) => {
    if (!user) return
    const { data } = await supabase
      .from('favourites')
      .select('*')
      .eq('media_id', mediaId)
      .eq('user_id', user.id)
    setFavourited(data && data.length > 0)
  }

  const handleLike = async () => {
    if (!user) return router.push('/login')
    if (liked) {
      await supabase.from('likes').delete()
        .eq('media_id', mediaId).eq('user_id', user.id)
      setLikes(prev => prev.filter(l => l.user_id !== user.id))
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ media_id: mediaId, user_id: user.id })
      setLikes(prev => [...prev, { user_id: user.id }])
      setLiked(true)
      // Create notification
      if (media.uploaded_by !== user.id) {
        await supabase.from('notifications').insert({
          user_id: media.uploaded_by,
          type: 'like',
          message: `${user.email} liked your photo`,
          related_media_id: mediaId,
          created_by: user.id
        })
      }
    }
  }

  const handleFavourite = async () => {
    if (!user) return router.push('/login')
    if (favourited) {
      await supabase.from('favourites').delete()
        .eq('media_id', mediaId).eq('user_id', user.id)
      setFavourited(false)
    } else {
      await supabase.from('favourites').insert({ media_id: mediaId, user_id: user.id })
      setFavourited(true)
    }
  }

  const handleComment = async () => {
    if (!user) return router.push('/login')
    if (!comment.trim()) return
    const { data } = await supabase.from('comments').insert({
      media_id: mediaId,
      user_id: user.id,
      content: comment.trim()
    }).select('*, profiles(username, full_name)').single()

    setComments(prev => [...prev, data])
    setComment('')

    // Create notification
    if (media.uploaded_by !== user.id) {
      await supabase.from('notifications').insert({
        user_id: media.uploaded_by,
        type: 'comment',
        message: `${user.email} commented on your photo`,
        related_media_id: mediaId,
        created_by: user.id
      })
    }
  }

  const handleDownload = async () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const publicId = media.public_id
  const watermarkedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/l_text:Arial_30_bold:CIG%20Media,co_white,o_60,g_south_east,x_10,y_10/${publicId}`
  
  const response = await fetch(watermarkedUrl)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `cig-media-${mediaId}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  if (!media) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Media not found
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-8">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Media */}
          <div className="lg:col-span-2">
            {media.media_type === 'video' ? (
              <video src={media.url} controls className="w-full rounded-xl" />
            ) : (
              <img src={media.url} alt="" className="w-full rounded-xl object-contain max-h-[70vh]" />
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">

            {/* Uploader info */}
            <div className="bg-gray-900 rounded-xl p-4">
              <p className="font-semibold">{media.profiles?.full_name || 'Unknown'}</p>
              <p className="text-gray-400 text-sm">@{media.profiles?.username}</p>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(media.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  liked ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {liked ? '❤️' : '🤍'} {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
              </button>
              <button
                onClick={handleFavourite}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  favourited ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {favourited ? '★' : '☆'} {favourited ? 'Saved' : 'Save to Favourites'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 transition"
              >
                ⬇️ Download with Watermark
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 transition"
              >
                🔗 Copy Link
              </button>
            </div>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-sm font-semibold mb-2 text-gray-400">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {media.tags.map(tag => (
                    <span key={tag} className="bg-blue-600/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
              <p className="font-semibold">Comments ({comments.length})</p>
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No comments yet</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-sm font-medium">{c.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-gray-300 text-sm mt-1">{c.content}</p>
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {user && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleComment}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm"
                  >
                    Post
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}