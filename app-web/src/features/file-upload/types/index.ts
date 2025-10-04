export interface UploadOptions {
  bucket: string
  folder?: string
  maxFileSize?: number
  allowedMimeTypes?: string[]
  resizeOptions?: ImageResizeOptions
  onProgress?: (progress: number) => void
}

export interface ImageResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface UploadedFile {
  id: string
  bucket: string
  path: string
  fileName: string
  originalName: string
  size: number
  mimeType: string
  publicUrl?: string
  uploadedAt: Date
}

export interface FileUploadError {
  message: string
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'UPLOAD_FAILED' | 'UNKNOWN'
  file?: File
}

export interface StorageListOptions {
  bucket: string
  folder?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export interface FileListItem {
  name: string
  id?: string
  size?: number
  mimeType?: string
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, unknown>
}
