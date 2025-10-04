'use client'

import { Upload, X } from 'lucide-react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { useFileUpload } from '../hooks'
import { formatFileSize } from '../lib'
import type { FileUploadError, UploadedFile, UploadOptions } from '../types'
import { FilePreview } from './file-preview'
import { FileUploadProgress } from './file-upload-progress'

interface FileUploadZoneProps {
  bucket: string
  folder?: string
  maxFiles?: number
  maxFileSize?: number
  accept?: Record<string, string[]>
  multiple?: boolean
  showPreview?: boolean
  className?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (errors: Array<{ file: File; error: FileUploadError }>) => void
  resizeOptions?: UploadOptions['resizeOptions']
}

export function FileUploadZone({
  bucket,
  folder,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept,
  multiple = true,
  showPreview = true,
  className,
  onUploadComplete,
  onUploadError,
  resizeOptions,
}: FileUploadZoneProps) {
  const { isUploading, progress, uploadedFiles, errors, uploadMultipleFiles, clearErrors } =
    useFileUpload()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      clearErrors()

      const uploadOptions: UploadOptions = {
        bucket,
        folder,
        maxFileSize,
        resizeOptions,
        allowedMimeTypes: accept ? Object.keys(accept) : undefined,
      }

      await uploadMultipleFiles(acceptedFiles, uploadOptions)

      if (onUploadComplete && uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles)
      }

      if (onUploadError && errors.length > 0) {
        onUploadError(errors)
      }
    },
    [
      bucket,
      folder,
      maxFileSize,
      accept,
      resizeOptions,
      uploadMultipleFiles,
      uploadedFiles,
      errors,
      onUploadComplete,
      onUploadError,
      clearErrors,
    ]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize: maxFileSize,
    multiple,
    disabled: isUploading,
  })

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          isUploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="h-10 w-10 text-muted-foreground" />

          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragActive
                ? 'ファイルをドロップしてください'
                : 'ファイルをドラッグ&ドロップまたはクリックして選択'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {accept && `対応形式: ${Object.values(accept).flat().join(', ')}`}
              {maxFileSize && ` • 最大サイズ: ${formatFileSize(maxFileSize)}`}
              {multiple && maxFiles && ` • 最大${maxFiles}ファイル`}
            </p>
          </div>
        </div>
      </div>

      {/* アップロード進捗 */}
      {isUploading && (
        <div className="mt-4">
          <FileUploadProgress progress={progress} />
        </div>
      )}

      {/* エラー表示 */}
      {(errors.length > 0 || fileRejections.length > 0) && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div
              key={`error-${error.file.name}-${index}`}
              className="flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <span>
                {error.file.name}: {error.error.message}
              </span>
              <X className="h-4 w-4" />
            </div>
          ))}
          {fileRejections.map(({ file, errors: rejectionErrors }, index) => (
            <div
              key={`rejection-${file.name}-${index}`}
              className="flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <span>
                {file.name}: {rejectionErrors.map((e) => e.message).join(', ')}
              </span>
              <X className="h-4 w-4" />
            </div>
          ))}
        </div>
      )}

      {/* アップロード済みファイルのプレビュー */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium">アップロード済みファイル</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {uploadedFiles.map((file) => (
              <FilePreview key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
