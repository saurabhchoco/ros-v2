import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value) {
  if (value === undefined || value === null || value === 0) return '—';
  const capped = Math.min(Math.abs(value), 999);
  return `${capped.toFixed(1)}%`;
}