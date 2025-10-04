import { GoogleButton } from '@/components/app/button/google-button'

interface GoogleAuthFormProps {
  children: React.ReactNode
  action: () => Promise<void>
}

export function GoogleAuthForm({ children, action }: GoogleAuthFormProps) {
  return (
    <form action={action}>
      <GoogleButton type="submit" className="w-full">
        {children}
      </GoogleButton>
    </form>
  )
}
