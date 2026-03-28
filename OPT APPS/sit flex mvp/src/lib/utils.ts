import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'dd.MM.yyyy') {
  return format(new Date(date), pattern, { locale: sr })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: sr })
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'HH:mm')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: sr })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function isOverdue(pickupTime: string, thresholdMin = 25): boolean {
  const pickup = new Date(pickupTime)
  const now = new Date()
  const diffMin = (now.getTime() - pickup.getTime()) / 60_000
  return diffMin > thresholdMin
}
