'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth'
import { getAuthenticatedStorageClient } from '../lib'
import type { FileListItem, StorageListOptions } from '../types'

interface UseStorageListReturn {
  files: FileListItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useStorageList(options: StorageListOptions): UseStorageListReturn {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFiles = useCallback(async () => {
    if (!user) {
      setFiles([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const storage = await getAuthenticatedStorageClient()
      const path = options.folder ? `${user.id}/${options.folder}` : user.id

      const { data, error: listError } = await storage.from(options.bucket).list(path, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: {
          column: options.sortBy || 'created_at',
          order: options.sortOrder || 'desc',
        },
      })

      if (listError) {
        throw new Error(listError.message)
      }

      setFiles(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('ファイル一覧の取得に失敗しました'))
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [
    user,
    options.bucket,
    options.folder,
    options.limit,
    options.offset,
    options.sortBy,
    options.sortOrder,
  ])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return {
    files,
    isLoading,
    error,
    refetch: fetchFiles,
  }
}
