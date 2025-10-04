// Components

export { FileList } from './components/file-list'
export { FilePreview } from './components/file-preview'
export { FileUploadProgress } from './components/file-upload-progress'
export { FileUploadZone } from './components/file-upload-zone'

// Hooks
export { useFileUpload } from './hooks/use-file-upload'
export { useStorageList } from './hooks/use-storage-list'
// Utility functions
// Storage client functions (for advanced usage)
export {
  deleteFile,
  formatFileSize,
  generateFilePath,
  getAuthenticatedStorageClient,
  getDownloadUrl,
  getStorageClient,
  isImageFile,
  resizeImage,
  sanitizeFileName,
  uploadFile,
  uploadFiles,
  validateFileSize,
  validateFileType,
} from './lib'

// サーバー用関数は別途インポートが必要
// import { getServerStorageClient } from '@/features/file-upload/lib/server-client'
// Types
export type {
  FileListItem,
  FileUploadError,
  ImageResizeOptions,
  StorageListOptions,
  UploadedFile,
  UploadOptions,
} from './types'
