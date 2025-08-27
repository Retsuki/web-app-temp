'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon, Edit, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { usePatchApiV1ProjectsProjectId } from '@/lib/api/generated/projects/projects'
import type { ProjectsListProjectsResponseItem } from '@/lib/api/generated/schemas'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'プロジェクト名は必須です'),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']),
  priority: z.number().min(0).max(2),
  progress: z.number().min(0).max(100),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DialogEditProjectProps {
  project: ProjectsListProjectsResponseItem
}

export function DialogEditProject({ project }: DialogEditProjectProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      status: project.status as 'active' | 'archived' | 'completed',
      priority: project.priority,
      progress: project.progress,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
    },
  })

  const updateProjectMutation = usePatchApiV1ProjectsProjectId()

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project.id,
        data: {
          name: values.name,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          progress: values.progress,
          startDate: values.startDate?.toISOString(),
          endDate: values.endDate?.toISOString(),
          tags: values.tags
            ? values.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
          metadata: project.metadata || {},
        },
      })

      toast.success('プロジェクトを更新しました')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to update project:', error)
      toast.error('プロジェクトの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          編集
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プロジェクトを編集</DialogTitle>
          <DialogDescription>プロジェクトの詳細を更新します</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: Webサイトリニューアル" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="プロジェクトの概要を入力..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">アクティブ</SelectItem>
                        <SelectItem value="archived">アーカイブ</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>優先度</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="優先度を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">低</SelectItem>
                        <SelectItem value="1">中</SelectItem>
                        <SelectItem value="2">高</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>進捗率: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      max={100}
                      step={1}
                    />
                  </FormControl>
                  <FormDescription>プロジェクトの進捗状況を設定します</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>開始日</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ja })
                            ) : (
                              <span>日付を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>終了日</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ja })
                            ) : (
                              <span>日付を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タグ</FormLabel>
                  <FormControl>
                    <Input placeholder="例: Web, モバイル, デザイン (カンマ区切り)" {...field} />
                  </FormControl>
                  <FormDescription>カンマで区切ってタグを入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                変更を保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}