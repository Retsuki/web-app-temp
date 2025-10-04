'use client'

import { Progress } from '@/components/ui/progress'

interface FileUploadProgressProps {
  progress: number
  fileName?: string
}

export function FileUploadProgress({ progress, fileName }: FileUploadProgressProps) {
  return (
    <div className="space-y-2">
      {fileName && <p className="text-sm text-muted-foreground">アップロード中: {fileName}</p>}
      <div className="flex items-center space-x-3">
        <Progress value={progress} className="flex-1" />
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
