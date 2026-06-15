import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function capitalizeWords(str) {
  if (!str) return ""
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPlayCount(count) {
  const n = Number(count)
  if (!n) return "0"
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toLocaleString()
}
