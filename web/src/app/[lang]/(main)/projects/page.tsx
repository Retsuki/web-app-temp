import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectList } from './project-list'

export default function ProjectsPage({ params }: { params: { lang: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">プロジェクト</h1>
        <p className="text-muted-foreground mt-2">あなたのプロジェクトを管理します</p>
      </div>

      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    </div>
  )
}
