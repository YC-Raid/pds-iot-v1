import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | null | undefined,
  currency = 'SGD',
  locale = 'en-SG',
  minimumFractionDigits = 2
) {
  if (amount == null || isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(minimumFractionDigits)}`;
  }
}
