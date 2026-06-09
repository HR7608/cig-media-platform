'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FaceSearch() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [selfie, setSelfie] = useState(null)
  const [selfieDescriptor, setSelfieDescriptor] = useState(null)
  const [faceChoices, setFaceChoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matches, setMatches] = useState([])
  const [status, setStatus] = useState('')
  const selfieRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      await loadModels()
    }
    init()
  }, [])

  const loadModels = async () => {
    setStatus('Loading face recognition models...')
    const faceapi = await import('face-api.js')
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ])
    setModelsLoaded(true)
    setStatus('')
  }

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setStatus('Detecting faces...')
    setSelfieDescriptor(null)
    setFaceChoices([])
    setMatches([])

    const imageUrl = URL.createObjectURL(file)
    setSelfie(imageUrl)

    const faceapi = await import('face-api.js')
    const img = await faceapi.fetchImage(imageUrl)
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()

    if (detections.length === 0) {
      setStatus('No face detected. Please try a clearer photo.')
      setLoading(false)
      return
    }

    if (detections.length === 1) {
      setSelfieDescriptor(detections[0].descriptor)
      setStatus('Face detected! Click "Find My Photos" to search.')
      setLoading(false)
      return
    }

    // Multiple faces — let user pick
    setStatus(`${detections.length} faces detected. Please select which one is you.`)
    setFaceChoices(detections)
    setLoading(false)
  }

  const handleFindPhotos = async () => {
    if (!selfieDescriptor) return
    setMatching(true)
    setMatches([])
    setStatus('Fetching all photos...')

    const faceapi = await import('face-api.js')

    const { data: allMedia } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'image')
      .eq('is_public', true)

    if (!allMedia || allMedia.length === 0) {
      setStatus('No photos found in the platform.')
      setMatching(false)
      return
    }

    setStatus(`Scanning ${allMedia.length} photos for your face...`)
    const found = []

    for (let i = 0; i < allMedia.length; i++) {
      const item = allMedia[i]
      setStatus(`Scanning photo ${i + 1} of ${allMedia.length}...`)

      try {
        const img = await faceapi.fetchImage(item.thumbnail_url || item.url)
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        for (const detection of detections) {
          const distance = faceapi.euclideanDistance(selfieDescriptor, detection.descriptor)
          if (distance < 0.5) {
            found.push({ ...item, distance })
            break
          }
        }
      } catch (err) {
        continue
      }
    }

    found.sort((a, b) => a.distance - b.distance)
    setMatches(found)
    setStatus(found.length > 0 ? `Found ${found.length} photos with your face!` : 'No matching photos found.')
    setMatching(false)
  }

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
          <div>
            <h1 className="text-3xl font-bold">Find My Photos</h1>
            <p className="text-gray-400 text-sm mt-1">Upload a selfie to find all photos containing your face</p>
          </div>
        </div>

        {/* Step 1 - Upload Selfie */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Step 1 — Upload a Reference Selfie</h2>
          <div className="flex gap-6 items-start">
            {selfie ? (
              <img
                src={selfie}
                alt="Your selfie"
                className="w-32 h-32 rounded-xl object-cover ring-2 ring-blue-500"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-gray-800 flex items-center justify-center text-4xl">
                🤳
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg cursor-pointer font-medium w-fit">
                {selfie ? 'Change Selfie' : 'Upload Selfie'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                  ref={selfieRef}
                />
              </label>
              <p className="text-gray-400 text-sm">Use a clear, front-facing photo for best results</p>
              {status && !matching && (
                <p className={`text-sm ${
                  status.includes('detected!') || status.includes('selected!')
                    ? 'text-green-400'
                    : status.includes('No face')
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>
                  {status}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Multiple faces picker */}
        {faceChoices.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Multiple Faces Detected</h2>
            <p className="text-gray-400 text-sm mb-4">Click on the face that is you</p>
            <div className="flex gap-4 flex-wrap">
              {faceChoices.map((detection, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelfieDescriptor(detection.descriptor)
                    setFaceChoices([])
                    setStatus('Face selected! Click "Find My Photos" to search.')
                  }}
                  className="bg-gray-800 hover:ring-2 hover:ring-blue-500 rounded-xl p-3 text-center transition"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-2xl mb-2">
                    👤
                  </div>
                  <p className="text-xs text-gray-400">Face {i + 1}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round(detection.detection.score * 100)}% confidence
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 - Find Photos */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Step 2 — Search All Photos</h2>
          <button
            onClick={handleFindPhotos}
            disabled={!selfieDescriptor || matching}
            className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {matching ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning...
              </span>
            ) : 'Find My Photos'}
          </button>
          {matching && (
            <p className="text-blue-400 text-sm mt-3">{status}</p>
          )}
        </div>

        {/* Results */}
        {matches.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              ✓ Found {matches.length} matching photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matches.map(item => (
                <Link href={`/media/${item.id}`} key={item.id}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-green-500 transition cursor-pointer relative">
                    <img
                      src={item.thumbnail_url || item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-1 rounded-full">
                      {Math.round((1 - item.distance) * 100)}% match
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!matching && status && matches.length === 0 && selfieDescriptor && !faceChoices.length && (
          <div className="text-center py-10">
            <p className="text-gray-400">{status}</p>
          </div>
        )}

      </div>
    </main>
  )
}