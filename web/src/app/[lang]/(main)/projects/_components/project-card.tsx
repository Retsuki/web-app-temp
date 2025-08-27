'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Activity,
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Skeleton } from '../../../../../components/ui/skeleton'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: number
  progress: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  tags: unknown[]
}

interface ProjectCardProps {
  project: Project
}

const statusConfig = {
  active: {
    label: 'アクティブ',
    className: 'bg-green-500/10 text-green-600 border-green-200',
    icon: Activity,
  },
  archived: {
    label: 'アーカイブ',
    className: 'bg-gray-500/10 text-gray-600 border-gray-200',
    icon: Archive,
  },
  completed: {
    label: '完了',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200',
    icon: CheckCircle,
  },
}

const priorityConfig = {
  0: { label: '低', className: 'bg-gray-100 text-gray-600' },
  1: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  2: { label: '高', className: 'bg-red-100 text-red-700' },
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active
  const priority =
    priorityConfig[project.priority as keyof typeof priorityConfig] || priorityConfig[0]
  const StatusIcon = status.icon

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return null
    }
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy年MM月dd日', { locale: ja })
    } catch {
      return null
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">
              <Link href={`/ja/projects/${project.id}`} className="hover:underline">
                {project.name}
              </Link>
            </CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2">{project.description}</CardDescription>
            )}
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                アーカイブ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('border', status.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
          <Badge variant="secondary" className={priority.className}>
            {priority.label}優先度
          </Badge>
        </div>

        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(project.startDate)}</span>
              </div>
            )}
            {project.startDate && project.endDate && <span>〜</span>}
            {project.endDate && !project.startDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>期限: {formatDate(project.endDate)}</span>
              </div>
            )}
            {project.endDate && project.startDate && <span>{formatDate(project.endDate)}</span>}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          更新: {format(new Date(project.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
        </div>
      </CardFooter>
    </Card>
  )
}

export const ProjectCardSkeleton = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-[200px]" />
    </div>
  )
}
