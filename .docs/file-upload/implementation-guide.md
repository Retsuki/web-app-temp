# ファイルアップロード機能 実装ガイド

## 1. セットアップ手順

### 1.1 Supabase Storage の有効化

1. Supabase Dashboardにログイン
2. Storageセクションに移動
3. 以下のバケットを作成：

```sql
-- バケット作成SQL
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-images', 'profile-images', true),
  ('user-documents', 'user-documents', false),
  ('user-files', 'user-files', false);
```

### 1.2 環境変数の追加

```bash
# .env.local に追加
NEXT_PUBLIC_SUPABASE_STORAGE_URL=${NEXT_PUBLIC_SUPABASE_URL}/storage/v1
```

## 2. 実装サンプルコード

### 2.1 Storage クライアントの初期化

```typescript
// /web/src/lib/storage/client.ts
import { createBrowserClient } from '@supabase/ssr';

let storageClient: ReturnType<typeof createBrowserClient>['storage'] | null = null;

export const getStorageClient = () => {
  if (!storageClient) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    storageClient = supabase.storage;
  }
  return storageClient;
};

// ユーザー認証付きクライアント
export const getAuthenticatedStorageClient = async () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  return supabase.storage;
};
```

### 2.2 アップロード関数の実装

```typescript
// /web/src/lib/storage/upload.ts
import { getAuthenticatedStorageClient } from './client';
import type { UploadOptions, UploadedFile } from './types';

export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadedFile> {
  const storage = await getAuthenticatedStorageClient();
  
  // ファイルバリデーション
  if (options.maxFileSize && file.size > options.maxFileSize) {
    throw new Error(`File size exceeds limit of ${options.maxFileSize} bytes`);
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
  
  // ファイルパスの生成
  const userId = await getCurrentUserId(); // 実装が必要
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(file.name);
  const filePath = `${userId}/${options.folder || ''}/${timestamp}-${sanitizedFileName}`;
  
  // 画像のリサイズ（必要な場合）
  let fileToUpload = file;
  if (options.resize && file.type.startsWith('image/')) {
    fileToUpload = await resizeImage(file, options.resize);
  }
  
  // アップロード実行
  const { data, error } = await storage
    .from(options.bucket)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        options.onProgress?.(percentage);
      }
    });
  
  if (error) {
    throw error;
  }
  
  // 公開URLの取得
  const { data: { publicUrl } } = storage
    .from(options.bucket)
    .getPublicUrl(data.path);
  
  return {
    id: data.id,
    name: file.name,
    size: file.size,
    type: file.type,
    url: publicUrl,
    uploadedAt: new Date(),
    bucket: options.bucket,
    path: data.path
  };
}

// ファイル名のサニタイズ
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
```

### 2.3 画像リサイズ機能

```typescript
// /web/src/lib/storage/image-resize.ts
import type { ImageResizeOptions } from './types';

export async function resizeImage(
  file: File,
  options: ImageResizeOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // アスペクト比を保持してリサイズ
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth,
          options.maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob に変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to resize image'));
              return;
            }
            
            const resizedFile = new File([blob], file.name, {
              type: options.format ? `image/${options.format}` : file.type,
              lastModified: Date.now()
            });
            
            resolve(resizedFile);
          },
          options.format ? `image/${options.format}` : file.type,
          options.quality / 100
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}
```

### 2.4 React コンポーネント実装例

```tsx
// /web/src/components/file-upload/file-upload-zone.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/use-file-upload';

interface FileUploadZoneProps {
  bucket: 'profile-images' | 'user-documents' | 'user-files';
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept?: Record<string, string[]>;
}

export function FileUploadZone({
  bucket,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf']
  }
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  
  const { upload, isUploading, progress, uploadedFiles, errors } = useFileUpload({
    bucket,
    maxFileSize,
    onComplete: () => {
      onUploadComplete?.(uploadedFiles);
      setFiles([]);
    }
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    upload(acceptedFiles);
  }, [upload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: maxFileSize,
    disabled: isUploading
  });
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg">ファイルをここにドロップ...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">
              ファイルをドラッグ&ドロップするか、クリックして選択
            </p>
            <p className="text-sm text-gray-500">
              最大{maxFiles}ファイル、各{maxFileSize / 1024 / 1024}MBまで
            </p>
          </div>
        )}
      </div>
      
      {/* アップロード中のファイル一覧 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {isUploading && (
            <Progress value={progress} className="mt-2" />
          )}
        </div>
      )}
      
      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 3. 使用例

### 3.1 プロフィール画像のアップロード

```tsx
// プロフィール設定ページでの使用例
import { FileUploadZone } from '@/components/file-upload/file-upload-zone';
import { useState } from 'react';

export function ProfileImageUpload() {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">プロフィール画像</h3>
      
      {profileImageUrl && (
        <img
          src={profileImageUrl}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover"
        />
      )}
      
      <FileUploadZone
        bucket="profile-images"
        maxFiles={1}
        accept={{
          'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        }}
        onUploadComplete={(files) => {
          if (files.length > 0) {
            setProfileImageUrl(files[0].url);
            // プロフィール更新APIを呼ぶ
          }
        }}
      />
    </div>
  );
}
```

### 3.2 ドキュメントアップロード

```tsx
// ドキュメント管理ページでの使用例
import { FileUploadZone } from '@/components/file-upload/file-upload-zone';
import { FileList } from '@/components/file-upload/file-list';

export function DocumentManager() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">ドキュメント管理</h2>
        
        <FileUploadZone
          bucket="user-documents"
          accept={{
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
            'text/plain': ['.txt']
          }}
          onUploadComplete={() => {
            // ファイル一覧を更新
            setRefreshKey(prev => prev + 1);
          }}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">アップロード済みファイル</h3>
        <FileList bucket="user-documents" refreshKey={refreshKey} />
      </div>
    </div>
  );
}
```

## 4. テスト実装

```typescript
// __tests__/file-upload.test.ts
import { uploadFile } from '@/lib/storage/upload';
import { resizeImage } from '@/lib/storage/image-resize';

describe('File Upload', () => {
  it('should validate file size', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt');
    
    await expect(
      uploadFile(largeFile, {
        bucket: 'user-files',
        maxFileSize: 10 * 1024 * 1024
      })
    ).rejects.toThrow('File size exceeds limit');
  });
  
  it('should resize image correctly', async () => {
    // テスト実装...
  });
});
```

## 5. トラブルシューティング

### 5.1 よくある問題と解決方法

**問題**: CORSエラーが発生する
```
解決方法: Supabase DashboardでStorage設定を確認し、
適切なCORSポリシーが設定されていることを確認
```

**問題**: アップロードが遅い
```
解決方法: 
1. 画像の場合はクライアントサイドリサイズを実装
2. チャンク分割アップロードを検討
3. 並列アップロード数を調整
```

**問題**: 認証エラー
```
解決方法:
1. Supabase Authのセッションが有効か確認
2. RLSポリシーが正しく設定されているか確認
3. anon keyが正しいか確認
```

## 6. パフォーマンスガイドライン

- 画像は必ずクライアントサイドでリサイズ
- サムネイルは別途生成して保存
- 大量ファイルは並列数を制限（最大3つ）
- プログレスバーで進捗を明確に表示
- エラー時は具体的なメッセージを表示