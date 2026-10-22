import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Lets callers override a component's default classes from outside.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
