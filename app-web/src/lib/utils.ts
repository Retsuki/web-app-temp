import { type ClassValue, clsx } from 'clsx'
import { customAlphabet, nanoid } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AppUtils = {
  generateId(length?: number): string {
    return nanoid(length)
  },
  generateAlphaId(length = 10): string {
    const generateAlpha = customAlphabet(
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      length
    )
    return generateAlpha()
  },
}
