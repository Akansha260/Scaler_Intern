import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://scaler-intern-2psq.onrender.com/api";

export function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${normalized}`;
}
