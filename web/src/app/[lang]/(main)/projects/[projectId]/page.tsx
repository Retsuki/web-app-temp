import { CalendarIcon, ClockIcon, FolderIcon, TagIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getApiV1ProjectsProjectIdServer } from '@/lib/api/server-api'
import { cn } from '@/lib/utils'
import { DialogDeleteProject } from '../_containers/dialog-delete-project/container'
import { DialogEditProject } from '../_containers/dialog-edit-project/container'

interface PageProps {
  params: Promise<{
    lang: string
    projectId: string
  }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params

  // APIからプロジェクトデータを取得
  try {
    const project = await getApiV1ProjectsProjectIdServer(projectId)

    if (!project) {
      notFound()
    }

    const priorityLabels = ['Low', 'Medium', 'High']
    const priorityColors = ['text-slate-500', 'text-yellow-500', 'text-red-500']

    const statusColors: Record<string, string> = {
      active: 'bg-green-500',
      archived: 'bg-gray-500',
      completed: 'bg-blue-500',
    }

    return (
      <div className="container mx-auto py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground text-lg">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <DialogEditProject project={project} />
            <DialogDeleteProject projectId={project.id} projectName={project.name} />
          </div>
        </div>

        {/* ステータスバッジと優先度 */}
        <div className="flex items-center gap-4 mb-6">
          <Badge className={cn(statusColors[project.status], 'text-white')}>{project.status}</Badge>
          <span className={cn('font-medium', priorityColors[project.priority])}>
            {priorityLabels[project.priority]} Priority
          </span>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
        </div>

        {/* メインコンテンツ */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              {/* プロジェクト情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.startDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Start Date: {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        End Date: {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* タグカード */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.tags && Array.isArray(project.tags) && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          <TagIcon className="w-3 h-3 mr-1" />
                          {String(tag)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags added</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {project.description || 'No description provided'}
                    </p>
                  </div>

                  {project.metadata && Object.keys(project.metadata).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Metadata</h3>
                      <pre className="bg-muted p-4 rounded-md overflow-auto">
                        {JSON.stringify(project.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Activity feed will be implemented in a future update
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <FolderIcon className="w-12 h-12 mr-4" />
                  <p>No activity to show</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error('Failed to fetch project:', error)
    notFound()
  }
}
