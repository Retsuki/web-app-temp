// Public API for auth feature

// Components
export { GoogleAuthForm } from './components/google-auth-form'
// Hooks
export { AuthProvider, useAuth } from './hooks/auth-context'
// Server Actions
export { signIn, signInWithGoogle, signOut, signUp } from './server/auth-actions'
// Types
export type { SignInData, SignUpData } from './types'

// Server Utilities - 別途インポートが必要
// import { requireAuth } from '@/features/auth/server/auth-server'
