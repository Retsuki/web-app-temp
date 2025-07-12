'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  deleteFile,
  FileList,
  FileUploadZone,
  getDownloadUrl,
  useStorageList,
} from '@/features/file-upload'

export function FileUploadSection() {
  const [activeTab, setActiveTab] = useState('profile')

  const profileFiles = useStorageList({
    bucket: 'profile-images',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const documentFiles = useStorageList({
    bucket: 'user-documents',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const generalFiles = useStorageList({
    bucket: 'user-files',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const handleDelete = async (bucket: string, fileName: string, refetch: () => void) => {
    try {
      await deleteFile(bucket, fileName)
      toast.success('ファイルを削除しました')
      refetch()
    } catch (_error) {
      toast.error('ファイルの削除に失敗しました')
    }
  }

  const handleDownload = async (bucket: string, fileName: string) => {
    try {
      const url = await getDownloadUrl(bucket, fileName)
      window.open(url, '_blank')
    } catch (_error) {
      toast.error('ダウンロードURLの生成に失敗しました')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ファイル管理</CardTitle>
        <CardDescription>
          プロフィール画像、ドキュメント、その他のファイルをアップロード・管理できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">プロフィール画像</TabsTrigger>
            <TabsTrigger value="documents">ドキュメント</TabsTrigger>
            <TabsTrigger value="general">一般ファイル</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <FileUploadZone
              bucket="profile-images"
              maxFiles={1}
              maxFileSize={5 * 1024 * 1024} // 5MB
              accept={{
                'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              }}
              multiple={false}
              resizeOptions={{
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.8,
              }}
              onUploadComplete={() => profileFiles.refetch()}
            />

            <FileList
              files={profileFiles.files}
              isLoading={profileFiles.isLoading}
              onDelete={(file) => handleDelete('profile-images', file.name, profileFiles.refetch)}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <FileUploadZone
              bucket="user-documents"
              folder="documents"
              maxFiles={10}
              maxFileSize={10 * 1024 * 1024} // 10MB
              accept={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
                  '.docx',
                ],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'text/plain': ['.txt'],
                'text/csv': ['.csv'],
              }}
              onUploadComplete={() => documentFiles.refetch()}
            />

            <FileList
              files={documentFiles.files}
              isLoading={documentFiles.isLoading}
              onDownload={(file) => handleDownload('user-documents', file.name)}
              onDelete={(file) => handleDelete('user-documents', file.name, documentFiles.refetch)}
            />
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <FileUploadZone
              bucket="user-files"
              folder="files"
              maxFiles={20}
              maxFileSize={50 * 1024 * 1024} // 50MB
              onUploadComplete={() => generalFiles.refetch()}
            />

            <FileList
              files={generalFiles.files}
              isLoading={generalFiles.isLoading}
              onDownload={(file) => handleDownload('user-files', file.name)}
              onDelete={(file) => handleDelete('user-files', file.name, generalFiles.refetch)}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
