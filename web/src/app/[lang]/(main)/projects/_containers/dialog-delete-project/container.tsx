'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { useDeleteApiV1ProjectsId } from '@/lib/api/generated/projects/projects'

interface DialogDeleteProjectProps {
  projectId: string
  projectName: string
  trigger?: React.ReactNode
}

export function DialogDeleteProject({ projectId, projectName, trigger }: DialogDeleteProjectProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  
  const deleteProjectMutation = useDeleteApiV1ProjectsId()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProjectMutation.mutateAsync({
        id: projectId,
      })

      toast.success('プロジェクトを削除しました')
      setOpen(false)
      router.push('/ja/projects')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('プロジェクトの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}