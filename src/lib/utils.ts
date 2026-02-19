import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Slug text must be a non-empty string');
  }

  // Convert to lowercase and trim
  let slug = text.toLowerCase().trim();

  // Remove special characters, keep only alphanumeric and spaces
  slug = slug.replace(/[^\w\s-]/g, '');

  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');

  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Add random 6-digit suffix for uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  return `${slug}-${randomSuffix}`;
}


export function generateOtpCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}