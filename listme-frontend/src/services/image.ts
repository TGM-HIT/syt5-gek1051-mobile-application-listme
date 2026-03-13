import api from './api'

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
}

// Resize + compress to JPEG in the browser before uploading.
// Caps the longer edge at 1024px and compresses at 80% quality.
async function compressImage(file: File): Promise<File> {
  const MAX = 1024
  const QUALITY = 0.8
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return }
        const name = file.name.replace(/\.[^.]+$/, '.jpg')
        resolve(new File([blob], name, { type: 'image/jpeg' }))
      }, 'image/jpeg', QUALITY)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

export const imageService = {
  async upload(file: File): Promise<string> {
    const compressed = await compressImage(file)
    const params = new URLSearchParams({ filename: compressed.name })
    const { uploadUrl, publicUrl } = await api
      .post<PresignResponse>(`/images/presign?${params}`)
      .then(r => r.data)
    await fetch(uploadUrl, {
      method: 'PUT',
      body: compressed,
      headers: { 'Content-Type': 'image/jpeg' },
    })
    return publicUrl
  },
}
