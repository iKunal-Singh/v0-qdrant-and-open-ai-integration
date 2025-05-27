import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to the existing utils.ts file
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return "Invalid date"
  }

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
