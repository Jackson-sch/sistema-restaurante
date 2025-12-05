import { clsx, type ClassValue } from "clsx"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}


export function formatDate(
  date: string | number | Date | null | undefined,
  formatString: string = "dd/MM/yyyy",
  options: Record<string, unknown> = {}
): string {
  try {
    if (!date) return "";
    let dateObj;

    // Convertir diferentes tipos de entrada a objeto Date
    if (typeof date === "string") {
      dateObj = parseISO(date);
    } else if (typeof date === "number") {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return "";
    }

    // Verificar si la fecha es válida
    if (!isValid(dateObj)) {
      return "";
    }

    // Formatear con localización en español
    return format(dateObj, formatString, { locale: es, ...options });
  } catch (error) {
    return "";
  }
}

export function getElapsedTime(date: Date): {
  minutes: number
  seconds: number
  totalMinutes: number
  formatted: string
} {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(diffMs / (1000 * 60))

  return {
    minutes,
    seconds,
    totalMinutes,
    formatted: `${minutes}m ${seconds}s`
  }
}