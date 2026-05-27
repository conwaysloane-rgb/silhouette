'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_PHOTOS = 5

interface UploadedPhoto {
  url: string
  preview: string
}

export default function PhotoUpload() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining)

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const uploaded: UploadedPhoto[] = []

    for (const file of toUpload) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { upsert: false })

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(path)
        uploaded.push({ url: publicUrl, preview: URL.createObjectURL(file) })
      }
    }

    setPhotos(prev => [...prev, ...uploaded])
    setUploading(false)
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* Hidden inputs carry URLs into the server action */}
      {photos.map((p, i) => (
        <input key={i} type="hidden" name="photos" value={p.url} />
      ))}

      <div className="grid grid-cols-3 gap-2 mb-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                Cover
              </span>
            )}
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-400 transition disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px]">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      <p className="text-xs text-neutral-400">
        {photos.length}/{MAX_PHOTOS} photos · First photo is the cover
      </p>
    </div>
  )
}
