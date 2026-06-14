import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function capitalizeWords(str) {
  if (!str) return ""
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}
