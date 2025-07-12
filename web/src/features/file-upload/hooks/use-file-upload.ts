'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { uploadFile, uploadFiles } from '../lib'
import type { FileUploadError, UploadedFile, UploadOptions } from '../types'

interface UseFileUploadReturn {
  isUploading: boolean
  progress: number
  uploadedFiles: UploadedFile[]
  errors: Array<{ file: File; error: FileUploadError }>
  uploadSingleFile: (file: File, options: UploadOptions) => Promise<UploadedFile | null>
  uploadMultipleFiles: (files: File[], options: UploadOptions) => Promise<void>
  clearErrors: () => void
  clearUploadedFiles: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<Array<{ file: File; error: FileUploadError }>>([])

  const uploadSingleFile = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadedFile | null> => {
      if (!user) {
        toast.error('アップロードするにはログインが必要です')
        return null
      }

      setIsUploading(true)
      setProgress(0)

      try {
        const uploadedFile = await uploadFile(file, user.id, options)

        setUploadedFiles((prev) => [...prev, uploadedFile])
        toast.success(`${file.name} をアップロードしました`)
        return uploadedFile
      } catch (error) {
        const fileError = error as FileUploadError
        setErrors((prev) => [...prev, { file, error: fileError }])
        toast.error(fileError.message || 'アップロードに失敗しました')
        return null
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [user]
  )

  const uploadMultipleFiles = useCallback(
    async (files: File[], options: UploadOptions): Promise<void> => {
      if (!user) {
        toast.error('アップロードするにはログインが必要です')
        return
      }

      setIsUploading(true)
      setProgress(0)
      setErrors([])

      try {
        const totalFiles = files.length
        let completedFiles = 0

        const { successful, failed } = await uploadFiles(files, user.id, options)

        setUploadedFiles((prev) => [...prev, ...successful])

        if (failed.length > 0) {
          setErrors(failed)
          toast.error(`${failed.length}個のファイルのアップロードに失敗しました`)
        }

        if (successful.length > 0) {
          toast.success(`${successful.length}個のファイルをアップロードしました`)
        }
      } catch (error) {
        toast.error('アップロード中にエラーが発生しました')
        console.error('Multiple file upload error:', error)
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [user]
  )

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  return {
    isUploading,
    progress,
    uploadedFiles,
    errors,
    uploadSingleFile,
    uploadMultipleFiles,
    clearErrors,
    clearUploadedFiles,
  }
}
