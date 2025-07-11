import { toast } from 'sonner'

export function useToast() {
  return {
    toast: (props: { title?: string; description?: string; variant?: 'success' | 'error' }) => {
      if (props.variant === 'error') {
        toast.error(props.title, {
          description: props.description,
        })
      } else {
        toast.success(props.title, {
          description: props.description,
        })
      }
    },
  }
}
