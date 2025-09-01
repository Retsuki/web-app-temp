'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { GetApiV1ProjectsId200 } from '@/lib/api/generated/schemas'
import { Button } from '@/components/ui/button'
import { DialogDeleteProject } from '../dialog-delete-project/container'
import { DialogEditProject } from '../dialog-edit-project/container'

interface ProjectActionsProps {
  project: GetApiV1ProjectsId200
  lang: string
}

export function ProjectActions({ project, lang }: ProjectActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="flex gap-2">
      <Button variant="default" onClick={() => setEditOpen(true)}>
        編集
      </Button>
      <DialogEditProject
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false)
          router.refresh()
        }}
      />

      <DialogDeleteProject
        projectId={project.id}
        projectName={project.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => {
          setDeleteOpen(false)
          router.push(`/${lang}/projects`)
        }}
      />
    </div>
  )
}

