import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toast: {
      success: (title?: string, description?: string) => {
        sonnerToast.success(title, {
          description,
        })
      },
      error: (title?: string, description?: string) => {
        sonnerToast.error(title, {
          description,
        })
      },
    },
  }
}
