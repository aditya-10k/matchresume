import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Removes all asterisks (*) from responses.
 * Converts markdown asterisk bullets (* item or * **item**) to clean hyphen bullets (- item)
 * and strips all remaining asterisks (e.g. **bold**, *italic*, stray *).
 */
export function stripAsterisks(text: string | null | undefined): string {
  if (!text) return "";
  // 1. Convert bullet asterisks at the start of lines to clean hyphen bullets
  let cleaned = text.replace(/^(\s*)\*+(\s+)/gm, "$1- ");
  // 2. Strip all remaining asterisks from everywhere in the text
  cleaned = cleaned.replace(/\*/g, "");
  return cleaned;
}

/**
 * Cleans an array of string items (e.g. skills, tags, followups) removing asterisks and leading bullets.
 */
export function stripAsterisksList(items: (string | null | undefined)[] | null | undefined): string[] {
  if (!items) return [];
  return items
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => stripAsterisks(item).trim())
    .map((item) => item.replace(/^[-•–—\s]+/, "").trim());
}
