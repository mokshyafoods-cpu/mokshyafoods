import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatProductWeight(value?: string | number | null, unit?: string | null) {
  if (value === null || value === undefined || value === '') {
    return '250g';
  }

  const normalizedValue = `${value}`.trim();
  if (!normalizedValue) {
    return '250g';
  }

  if (/^\d+(?:\.\d+)?\s*(g|kg|mg|ml|l|pcs|pieces|pack|packs|box|boxes)$/i.test(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedUnit = (unit || 'g').trim().toLowerCase();
  if (normalizedUnit === '' || normalizedUnit === 'g') {
    return `${normalizedValue}g`;
  }

  return `${normalizedValue}${normalizedUnit}`;
}

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}
