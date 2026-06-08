import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await cloudinary.uploader.upload(dataUri, {
  folder: 'cig-media-platform',
  resource_type: 'auto'
})

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      thumbnail_url: result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
      tags: result.tags || []
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}