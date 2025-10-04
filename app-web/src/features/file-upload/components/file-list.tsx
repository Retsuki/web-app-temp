'use client'

import { Download, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFileSize } from '../lib'
import type { FileListItem } from '../types'

interface FileListProps {
  files: FileListItem[]
  isLoading?: boolean
  onDownload?: (file: FileListItem) => void
  onDelete?: (file: FileListItem) => void
}

export function FileList({ files, isLoading, onDownload, onDelete }: FileListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">まだファイルがアップロードされていません</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ファイル名</TableHead>
            <TableHead>サイズ</TableHead>
            <TableHead>更新日時</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id || file.name}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{file.size ? formatFileSize(file.size) : '-'}</TableCell>
              <TableCell>
                {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString('ja-JP') : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onDownload && (
                    <Button variant="ghost" size="icon" onClick={() => onDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(file)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
