'use client'

import { Plus, Search } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import { Skeleton } from '../../../../../components/ui/skeleton'
import { AppUtils } from '../../../../../lib/utils'
import { EmptyState } from '../_components/empty-state'
import { ProjectCard, ProjectCardSkeleton } from '../_components/project-card'
import { DialogCreateProject } from './dialog-create-project/container'

export const ProjectContainer = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data, error, refetch } = useGetApiV1Projects()

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">プロジェクトの読み込みに失敗しました。</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          再試行
        </Button>
      </div>
    )
  }

  const projects = data?.projects || []
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">プロジェクト</h1>
        <p className="text-muted-foreground mt-2">あなたのプロジェクトを管理します</p>
      </div>

      <Suspense fallback={<ProjectListSkeleton />}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="プロジェクトを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規プロジェクト
          </Button>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onCreateClick={() => setIsCreateDialogOpen(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <DialogCreateProject
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            refetch()
            setIsCreateDialogOpen(false)
          }}
        />
      </Suspense>
    </div>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      {[...Array(6)].map((_) => (
        <ProjectCardSkeleton key={AppUtils.generateId(10)} />
      ))}
    </div>
  )
}
