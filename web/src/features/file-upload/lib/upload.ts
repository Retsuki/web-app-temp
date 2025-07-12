import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { FileUploadError, UploadedFile, UploadOptions } from '../types'
import { getAuthenticatedStorageClient } from './client'
import {
  generateFilePath,
  isImageFile,
  resizeImage,
  validateFileSize,
  validateFileType,
} from './utils'

/**
 * 単一ファイルをアップロード
 */
export async function uploadFile(
  file: File,
  userId: string,
  options: UploadOptions
): Promise<UploadedFile> {
  const { bucket, folder, maxFileSize, allowedMimeTypes, resizeOptions, onProgress } = options

  // ファイルタイプ検証
  if (!validateFileType(file, allowedMimeTypes)) {
    const error: FileUploadError = {
      message: `許可されていないファイルタイプです: ${file.type}`,
      code: 'INVALID_FILE_TYPE',
      file,
    }
    throw error
  }

  // ファイルサイズ検証
  if (!validateFileSize(file, maxFileSize)) {
    const error: FileUploadError = {
      message: `ファイルサイズが大きすぎます（最大: ${maxFileSize! / 1024 / 1024}MB）`,
      code: 'FILE_TOO_LARGE',
      file,
    }
    throw error
  }

  try {
    const storage = await getAuthenticatedStorageClient()
    const supabase = createBrowserClient()

    let uploadFile: File | Blob = file

    // 画像の場合はリサイズ処理
    if (isImageFile(file) && resizeOptions) {
      try {
        uploadFile = await resizeImage(file, resizeOptions)
      } catch (error) {
        console.warn('画像のリサイズに失敗しました。元のファイルをアップロードします。', error)
      }
    }

    // ファイルパス生成
    const filePath = generateFilePath(userId, file.name, folder)

    // アップロード実行
    const { data, error } = await storage.from(bucket).upload(filePath, uploadFile, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      const uploadError: FileUploadError = {
        message: error.message || 'アップロードに失敗しました',
        code: 'UPLOAD_FAILED',
        file,
      }
      throw uploadError
    }

    // アップロード成功したファイル情報を返す
    const uploadedFile: UploadedFile = {
      id: data.id,
      bucket,
      path: data.path,
      fileName: file.name,
      originalName: file.name,
      size: uploadFile instanceof File ? uploadFile.size : file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    }

    // 公開バケットの場合はパブリックURLを取得
    if (bucket === 'profile-images') {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

      if (urlData) {
        uploadedFile.publicUrl = urlData.publicUrl
      }
    }

    return uploadedFile
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw error
    }

    const uploadError: FileUploadError = {
      message: 'アップロード中に予期しないエラーが発生しました',
      code: 'UNKNOWN',
      file,
    }
    throw uploadError
  }
}

/**
 * 複数ファイルをアップロード
 */
export async function uploadFiles(
  files: File[],
  userId: string,
  options: UploadOptions
): Promise<{
  successful: UploadedFile[]
  failed: Array<{ file: File; error: FileUploadError }>
}> {
  const results = await Promise.allSettled(files.map((file) => uploadFile(file, userId, options)))

  const successful: UploadedFile[] = []
  const failed: Array<{ file: File; error: FileUploadError }> = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push({
        file: files[index],
        error: result.reason,
      })
    }
  })

  return { successful, failed }
}

/**
 * ファイルを削除
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const storage = await getAuthenticatedStorageClient()

  const { error } = await storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`ファイルの削除に失敗しました: ${error.message}`)
  }
}

/**
 * ファイルのダウンロードURLを取得（非公開バケット用）
 */
export async function getDownloadUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const storage = await getAuthenticatedStorageClient()

  const { data, error } = await storage.from(bucket).createSignedUrl(path, expiresIn)

  if (error || !data) {
    throw new Error(`ダウンロードURLの生成に失敗しました: ${error?.message}`)
  }

  return data.signedUrl
}
