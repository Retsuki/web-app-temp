import { signInWithGoogle } from '@/lib/auth/actions'
import { GoogleButton } from '@/components/app/button'

export function GoogleAuthForm({ children }: { children: React.ReactNode }) {
  return (
    <form action={signInWithGoogle}>
      <GoogleButton type="submit" className="w-full">
        {children}
      </GoogleButton>
    </form>
  )
}