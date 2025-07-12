'use client'

import { FileText, Image as ImageIcon, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatFileSize, isImageFile } from '../lib'
import type { UploadedFile } from '../types'

interface FilePreviewProps {
  file: UploadedFile
  onRemove?: (file: UploadedFile) => void
  className?: string
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false)
  const isImage = isImageFile(file.mimeType)

  return (
    <div className={cn('group relative overflow-hidden rounded-lg border bg-card', className)}>
      <div className="aspect-square">
        {isImage && file.publicUrl && !imageError ? (
          <img
            src={file.publicUrl}
            alt={file.fileName}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {isImage ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FileText className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="truncate text-xs font-medium text-white">{file.fileName}</p>
        <p className="text-xs text-white/80">{formatFileSize(file.size)}</p>
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
