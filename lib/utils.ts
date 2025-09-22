import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: Array<string | number | null | false | undefined>) {
  return twMerge(clsx(inputs))
}
