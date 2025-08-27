'use client'

import { Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/features/toast/use-toast'
import { useDeleteApiV1ProjectsId } from '@/lib/api/generated/projects/projects'

interface DialogDeleteProjectProps {
  projectId: string
  projectName: string
  trigger?: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DialogDeleteProject({ 
  projectId, 
  projectName, 
  trigger, 
  open, 
  onOpenChange, 
  onSuccess 
}: DialogDeleteProjectProps) {
  const { toast } = useToast()
  
  const deleteProjectMutation = useDeleteApiV1ProjectsId({
    mutation: {
      onSuccess: () => {
        toast.success('プロジェクトを削除しました')
        onSuccess()
      },
      onError: () => {
        toast.error('プロジェクトの削除に失敗しました')
      },
    },
  })

  const handleDelete = () => {
    deleteProjectMutation.mutate({
      id: projectId,
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>プロジェクトを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{projectName}」を削除しようとしています。この操作は取り消すことができません。
            プロジェクトに関連するすべてのデータが永久に削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive hover:bg-destructive/90"
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}