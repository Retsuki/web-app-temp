import type { ImageResizeOptions } from '../types'

/**
 * ファイル名をサニタイズ
 */
export function sanitizeFileName(fileName: string): string {
  // 日本語や特殊文字を取り除き、安全なファイル名に変換
  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')

  // 危険な文字を削除/置換
  const sanitized = nameWithoutExt
    .replace(/[^\w\s\-._\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '') // 英数字、ひらがな、カタカナ、漢字以外を削除
    .replace(/\s+/g, '-') // スペースをハイフンに置換
    .replace(/^-+|-+$/g, '') // 先頭と末尾のハイフンを削除
    .substring(0, 100) // 長さ制限

  return sanitized + (extension ? `.${extension}` : '')
}

/**
 * ファイルパスを生成（user_id/folder/timestamp-filename形式）
 */
export function generateFilePath(userId: string, fileName: string, folder?: string): string {
  const timestamp = Date.now()
  const sanitizedName = sanitizeFileName(fileName)
  const parts = [userId]

  if (folder) {
    parts.push(folder)
  }

  parts.push(`${timestamp}-${sanitizedName}`)

  return parts.join('/')
}

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * MIMEタイプから拡張子を取得
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }

  return mimeToExt[mimeType] || ''
}

/**
 * ファイルが画像かどうかを判定
 */
export function isImageFile(file: File | string): boolean {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType.startsWith('image/')
}

/**
 * 画像をリサイズ（Canvas APIを使用）
 */
export async function resizeImage(file: File, options: ImageResizeOptions): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'jpeg' } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // アスペクト比を保持しながらリサイズ
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height

        if (width > height) {
          width = maxWidth
          height = width / aspectRatio
        } else {
          height = maxHeight
          width = height * aspectRatio
        }
      }

      canvas.width = width
      canvas.height = height

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height)

      // Blobに変換
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // 画像を読み込み
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  })
}

/**
 * ファイルタイプを検証
 */
export function validateFileType(file: File, allowedMimeTypes?: string[]): boolean {
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
    return true
  }

  return allowedMimeTypes.some((type) => {
    if (type.endsWith('/*')) {
      // ワイルドカード対応（例: image/*）
      const baseType = type.replace('/*', '')
      return file.type.startsWith(baseType)
    }
    return file.type === type
  })
}

/**
 * ファイルサイズを検証
 */
export function validateFileSize(file: File, maxSize?: number): boolean {
  if (!maxSize) {
    return true
  }

  return file.size <= maxSize
}
