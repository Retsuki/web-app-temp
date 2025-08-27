import { Folder, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  searchQuery: string
  onCreateClick: () => void
}

export function EmptyState({ searchQuery, onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Folder className="h-8 w-8 text-muted-foreground" />
      </div>

      {searchQuery ? (
        <>
          <h3 className="text-lg font-semibold mb-2">検索結果が見つかりません</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            「{searchQuery}」に一致するプロジェクトが見つかりませんでした。
            別のキーワードで検索してみてください。
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">プロジェクトがありません</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            最初のプロジェクトを作成して、タスクやアイデアを整理しましょう。
          </p>
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            新規プロジェクトを作成
          </Button>
        </>
      )}
    </div>
  )
}
