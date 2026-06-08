'use client'
import { useEffect, useState, use, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AlbumPage({ params }) {
  const { id, albumId } = use(params)
  const router = useRouter()
  const [album, setAlbum] = useState(null)
  const [media, setMedia] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await fetchAlbum()
      await fetchMedia()
    }
    init()
  }, [])

  const fetchAlbum = async () => {
    const { data } = await supabase
      .from('albums')
      .select('*, profiles(username, full_name)')
      .eq('id', albumId)
      .single()
    setAlbum(data)
  }

  const fetchMedia = async () => {
    const { data } = await supabase
      .from('media')
      .select('*, profiles(username, full_name)')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false })
    setMedia(data || [])
    setLoading(false)
  }

  const uploadFiles = async (files) => {
    if (!user) return router.push('/login')
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Uploading ${i + 1} of ${files.length}...`)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.error) {
        alert('Upload failed: ' + data.error)
        continue
      }

      await supabase.from('media').insert({
        album_id: albumId,
        event_id: id,
        uploaded_by: user.id,
        url: data.url,
        thumbnail_url: data.thumbnail_url,
        public_id: data.public_id,
        tags: data.tags,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        is_public: album.is_public
      })
    }

    setUploadProgress('')
    setUploading(false)
    await fetchMedia()
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) uploadFiles(files)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) uploadFiles(files)
  }, [album, user])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.push(`/events/${id}`)}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
        >
          ← Back to Event
        </button>

        {/* Album Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">{album?.name}</h1>
            {album?.description && (
              <p className="text-gray-400 mt-1">{album.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {media.length} photos · By {album?.profiles?.full_name || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Upload Area */}
        {user && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-10 text-center mb-8 transition ${
              dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            {uploading ? (
              <div>
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">{uploadProgress}</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">📁</p>
                <p className="text-gray-300 font-medium mb-1">Drag & drop photos here</p>
                <p className="text-gray-500 text-sm mb-4">or</p>
                <label className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg cursor-pointer font-medium">
                  Browse Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-600 text-xs mt-3">Supports JPG, PNG, GIF, MP4</p>
              </div>
            )}
          </div>
        )}

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-xl">
            <p className="text-gray-400 text-lg">No photos yet</p>
            <p className="text-gray-600 text-sm mt-1">Upload some photos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map(item => (
              <Link href={`/media/${item.id}`} key={item.id}>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-blue-500 transition cursor-pointer group relative">
                  {item.media_type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                  )}
                  {/* Tags overlay */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-blue-600/80 px-2 py-0.5 rounded-full">
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