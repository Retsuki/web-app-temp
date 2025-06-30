import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SignUpForm } from './signup-form'
import { GoogleAuthForm } from '@/components/app/auth/google-auth-form'
import { signInWithGoogle } from '@/lib/auth/actions'

export default function SignUpPage() {
  const t = useTranslations()
  
  async function handleGoogleSignIn() {
    'use server'
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signUpTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('common.signIn')}
            </Link>
          </p>
        </div>
        
        <SignUpForm />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">または</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleAuthForm action={handleGoogleSignIn}>
              {t('auth.signUpWithGoogle')}
            </GoogleAuthForm>
          </div>
        </div>
      </div>
    </div>
  )
}