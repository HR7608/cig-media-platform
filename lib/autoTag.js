export async function generateTags(imageUrl) {
  try {
    const tf = await import('@tensorflow/tfjs')
    const mobilenet = await import('@tensorflow-models/mobilenet')

    // Load model
    const model = await mobilenet.load()

    // Load image
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    // Classify image
    const predictions = await model.classify(img)

    // Extract tag names and filter by confidence
    const tags = predictions
      .filter(p => p.probability > 0.1)
      .map(p => {
        // MobileNet returns tags like "golden retriever, dog" — take first word/phrase
        const label = p.className.split(',')[0].toLowerCase().trim()
        return label
      })

    return tags
  } catch (err) {
    console.error('Auto-tagging failed:', err)
    return []
  }
}